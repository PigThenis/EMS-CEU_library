from __future__ import annotations

import asyncio
import time
from typing import Optional

from pydantic import BaseModel

from ems_ceu.fetcher import Fetcher
from ems_ceu.persistence.firebase_repo import FirebaseRepo
from ems_ceu.adapters.example_site import parse_example_site


class RunArgs(BaseModel):
    url: str
    provider: str
    city: Optional[str] = None
    state: Optional[str] = None
    wait_for: Optional[str] = None  # reserved for future browser fallback


async def run_once(args: RunArgs) -> None:
    repo = FirebaseRepo()
    fetcher = Fetcher()

    res = await fetcher.fetch(args.url)
    if res.status_code >= 400:
        raise RuntimeError(f"fetch failed: {res.status_code}")

    # Store snapshot
    url_hash = str(abs(hash(args.url)))
    snapshot_path = f"snapshots/example/{int(time.time())}/{url_hash}.html"
    repo.upload_snapshot(snapshot_path, res.content, content_type="text/html")

    # Parse to EventRaw
    html = res.content.decode(errors="ignore")
    events = parse_example_site(
        html=html,
        url=args.url,
        provider=args.provider,
        city=args.city,
        state=args.state,
    )

    # Upsert events_raw
    for ev in events:
        data = ev.model_dump()
        data["raw_html_path"] = snapshot_path
        repo.upsert_event_raw(ev.id, data)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run example adapter on a URL and store EventRaw")
    parser.add_argument("--url", required=True)
    parser.add_argument("--provider", required=True)
    parser.add_argument("--city")
    parser.add_argument("--state")
    args = parser.parse_args()

    asyncio.run(run_once(RunArgs(**vars(args))))

