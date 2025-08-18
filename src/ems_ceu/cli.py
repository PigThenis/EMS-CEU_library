import argparse
import asyncio
import time
from hashlib import sha256

from .config import Settings
from .fetcher import Fetcher
from .persistence.firebase_repo import FirebaseRepo
from .logging import get_logger


log = get_logger()


def _hash_url(url: str) -> str:
    return sha256(url.encode("utf-8")).hexdigest()


async def cmd_fetch(url: str):
    settings = Settings.from_env()
    repo = FirebaseRepo(settings)
    fetcher = Fetcher(settings)

    url_hash = _hash_url(url)
    page_doc = repo.get_page(url_hash) or {}

    etag = page_doc.get("etag") if page_doc else None
    last_mod = page_doc.get("last_modified") if page_doc else None

    res = await fetcher.fetch(url, etag=etag, last_modified=last_mod)
    if res.status_code == 304:
        log.info("not_modified", url=url)
        return

    snapshot_path = f"snapshots/manual/{int(time.time())}/{url_hash}.html"
    repo.upload_snapshot(snapshot_path, res.content, content_type="text/html")

    repo.upsert_page(
        url_hash,
        {
            "url": url,
            "fetched_at": time.time(),
            "status_code": res.status_code,
            "etag": res.etag,
            "last_modified": res.last_modified,
            "content_hash": _hash_url(res.content.decode(errors="ignore")),
            "storage_path": snapshot_path,
        },
    )
    log.info("fetched", url=url, status=res.status_code, snapshot=snapshot_path)


def main():
    parser = argparse.ArgumentParser(prog="ems_ceu")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_fetch = sub.add_parser("fetch", help="Fetch a single URL and store snapshot + page doc")
    p_fetch.add_argument("--url", required=True)

    args = parser.parse_args()

    if args.cmd == "fetch":
        asyncio.run(cmd_fetch(args.url))


if __name__ == "__main__":
    main()

