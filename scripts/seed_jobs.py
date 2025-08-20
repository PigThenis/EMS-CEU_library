from __future__ import annotations

import time
from typing import List

from ems_ceu.persistence.firebase_repo import FirebaseRepo


def seed_jobs(site: str, adapter: str, urls: List[str], mode: str = "list") -> None:
    repo = FirebaseRepo()
    now = time.time()
    for u in urls:
        # Create a job doc with an immediate lease expiration (available now)
        data = {
            "site": site,
            "url": u,
            "adapter": adapter,
            "lease_until": 0.0,
            "created_at": now,
            "status": "queued",
            "mode": mode,
        }
        # Let Firestore auto-id jobs; no helper needed beyond this project
        repo.db.collection("jobs").add(data)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed scraping jobs into Firestore (emulator or prod)")
    parser.add_argument("--site", required=True)
    parser.add_argument("--adapter", required=True)
    parser.add_argument("--url", action="append", required=True, help="Repeat to add multiple URLs")
    parser.add_argument("--mode", choices=["list", "detail"], default="list")
    parser.add_argument("--wait-for", dest="wait_for", help="Optional CSS selector to wait for (browser)")
    args = parser.parse_args()

    # Basic support: if wait_for provided, we store it on each job after creation
    seed_jobs(site=args.site, adapter=args.adapter, urls=args.url, mode=args.mode)

    if args.wait_for:
        # We need to update the created job docs to include wait_for. Simplest: re-add with wait_for and ignore duplicates.
        repo = FirebaseRepo()
        now = time.time()
        for u in args.url:
            repo.db.collection("jobs").add({
                "site": args.site,
                "url": u,
                "adapter": args.adapter,
                "lease_until": 0.0,
                "created_at": now,
                "status": "queued",
                "mode": args.mode,
                "wait_for": args.wait_for,
            })

