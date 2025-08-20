from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Any, Optional

from ems_ceu.fetcher import Fetcher
from ems_ceu.logging import get_logger
from ems_ceu.persistence.firebase_repo import FirebaseRepo
from ems_ceu.adapters.registry import get_adapter, Adapter
from ems_ceu.mcp_client import BrowserClient

log = get_logger()


@dataclass
class Job:
    id: str
    site: str
    url: str
    adapter: str
    mode: str = "detail"  # "list" or "detail"
    wait_for: Optional[str] = None


async def process_job(repo: FirebaseRepo, fetcher: Fetcher, job: Job) -> None:
    # Fetch HTML (HTTP first). If job specifies wait_for, use browser service.
    html: str
    content_bytes: bytes
    if job.wait_for:
        try:
            bc = BrowserClient()
            session = await bc.new_session()
            try:
                await session.navigate(job.url)
                await session.wait_for(job.wait_for)
                html = await session.get_content(format="html")
                content_bytes = html.encode()
            finally:
                await session.close()
        except Exception as e:
            repo.complete_job(job.id, status="error", message=f"browser_error: {e}")
            log.exception("job_browser_error", job=job.id, url=job.url)
            return
    else:
        res = await fetcher.fetch(job.url)
        if res.status_code >= 400:
            repo.complete_job(job.id, status="error", message=f"HTTP {res.status_code}")
            log.error("job_http_error", job=job.id, url=job.url, status=res.status_code)
            return
        html = res.content.decode(errors="ignore")
        content_bytes = res.content
    # Store snapshot
    url_hash = str(abs(hash(job.url)))
    snapshot_path = f"snapshots/jobs/{int(time.time())}/{url_hash}.html"
    repo.upload_snapshot(snapshot_path, content_bytes, content_type="text/html")

    # Parse via adapter (supports list->detail fanout if adapter has list_urls)
    adapter: Adapter = get_adapter(job.adapter)
    try:
        # If this job is explicitly a list job and adapter provides list_urls, enqueue detail jobs
        if adapter.list_urls and job.mode == "list":
            detail_urls = adapter.list_urls(html, job.url)
            enq = 0
            for du in detail_urls[:100]:  # safety cap
                data = {
                    "site": job.site,
                    "url": du,
                    "adapter": job.adapter,
                    "lease_until": 0.0,
                    "created_at": time.time(),
                    "status": "queued",
                    "mode": "detail",
                }
                repo.db.collection("jobs").add(data)
                enq += 1
            repo.complete_job(job.id, status="done", message=f"enqueued_detail:{enq}")
            log.info("job_list_fanout", job=job.id, enqueued=enq)
            return

        # Otherwise parse a detail page
        events = adapter.parse_detail(html=html, url=job.url, provider=job.site)

    except Exception as e:
        repo.complete_job(job.id, status="error", message=f"parse_error: {e}")
        log.exception("job_parse_error", job=job.id, url=job.url)
        return

    # Upsert events_raw
    for ev in events:
        data = ev.model_dump()
        data["raw_html_path"] = snapshot_path
        repo.upsert_event_raw(ev.id, data)

    repo.complete_job(job.id, status="done", message=f"events_raw:{len(events)}")
    log.info("job_done", job=job.id, url=job.url, events_raw=len(events))


async def worker_loop(site: str, poll_interval_s: int = 5) -> None:
    repo = FirebaseRepo()
    fetcher = Fetcher()

    run_id = repo.start_run(site)
    ok = 0
    err = 0
    try:
        while True:
            now_ts = time.time()
            leased = repo.lease_job(site=site, now_ts=now_ts, lease_s=60)
            if not leased:
                await asyncio.sleep(poll_interval_s)
                continue

            job = Job(
                id=leased["id"],
                site=leased.get("site", site),
                url=leased["url"],
                adapter=leased.get("adapter", "example"),
                mode=leased.get("mode", "detail"),
                wait_for=leased.get("wait_for"),
            )

            try:
                await process_job(repo, fetcher, job)
                ok += 1
            except Exception as e:
                err += 1
                log.exception("job_unhandled_error", job=job.id)
                repo.complete_job(job.id, status="error", message=str(e))
    finally:
        repo.finish_run(run_id, success_count=ok, error_count=err)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scraper worker loop")
    parser.add_argument("--site", required=True, help="Site name to pull jobs for")
    parser.add_argument("--poll", type=int, default=5, help="Poll interval seconds")
    args = parser.parse_args()

    asyncio.run(worker_loop(site=args.site, poll_interval_s=args.poll))

