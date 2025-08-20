from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Any
import base64
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import initialize_app
from google.cloud import firestore, storage

from ..config import Settings


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class FirestoreRefs:
    db: firestore.Client
    bucket: storage.Bucket


class FirebaseRepo:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or Settings.from_env()
        # Requires GOOGLE_APPLICATION_CREDENTIALS env var. Do not print it.
        if not firebase_admin._apps:
            initialize_app()
        self.db = firestore.Client(project=self.settings.project_id) if self.settings.project_id else firestore.Client()
        bucket_name = self.settings.storage_bucket
        if not bucket_name:
            # Fallback to default naming; adjust to your project
            # e.g., "your-project.appspot.com"
            bucket_name = f"{self.db.project}.appspot.com"
        self.bucket = storage.Client(project=self.db.project).bucket(bucket_name)

    # ---- Sources ----
    def upsert_source(self, source_id: str, data: dict[str, Any]) -> None:
        data = {**data, "updated_at": _utc_now_iso()}
        self.db.collection("sources").document(source_id).set(data, merge=True)

    # ---- Pages ----
    def upsert_page(self, url_hash: str, data: dict[str, Any]) -> None:
        data = {**data, "updated_at": _utc_now_iso()}
        self.db.collection("pages").document(url_hash).set(data, merge=True)

    def get_page(self, url_hash: str) -> Optional[dict[str, Any]]:
        snap = self.db.collection("pages").document(url_hash).get()
        return snap.to_dict() if snap.exists else None

    # ---- Items / Events ----
    def upsert_item(self, item_id: str, data: dict[str, Any]) -> None:
        data = {**data, "updated_at": _utc_now_iso()}
        self.db.collection("items").document(item_id).set(data, merge=True)

    def upsert_event_raw(self, event_id: str, data: dict[str, Any]) -> None:
        data = {**data, "updated_at": _utc_now_iso()}
        self.db.collection("events_raw").document(event_id).set(data, merge=True)

    def upsert_event(self, event_id: str, data: dict[str, Any]) -> None:
        data = {**data, "updated_at": _utc_now_iso()}
        self.db.collection("events").document(event_id).set(data, merge=True)

    # ---- Runs ----
    def start_run(self, site: str) -> str:
        ref = self.db.collection("runs").document()
        ref.set({"site": site, "started_at": _utc_now_iso(), "status": "running"})
        return ref.id

    def finish_run(self, run_id: str, success_count: int, error_count: int, notes: str | None = None) -> None:
        self.db.collection("runs").document(run_id).set(
            {
                "finished_at": _utc_now_iso(),
                "success_count": success_count,
                "error_count": error_count,
                "notes": notes or "",
                "status": "finished",
            },
            merge=True,
        )

    # ---- Storage ----
    def upload_snapshot(self, path: str, content: bytes, content_type: str = "text/html") -> None:
        blob = self.bucket.blob(path)
        blob.upload_from_string(content, content_type=content_type)

    # ---- Job Queue (Firestore-based lease) ----
    def lease_job(self, site: str, now_ts: float, lease_s: int = 60) -> Optional[dict[str, Any]]:
        # Simple lease: jobs where lease_until <= now or missing
        jobs = (
            self.db.collection("jobs")
            .where("site", "==", site)
            .where("lease_until", "<=", now_ts)
            .limit(1)
            .stream()
        )
        for job_snap in jobs:
            job = job_snap.to_dict()
            job_id = job_snap.id
            lease_until = now_ts + lease_s
            self.db.collection("jobs").document(job_id).set({"lease_until": lease_until}, merge=True)
            job["id"] = job_id
            return job
        return None

    def complete_job(self, job_id: str, status: str, message: str | None = None) -> None:
        self.db.collection("jobs").document(job_id).set({"status": status, "message": message or ""}, merge=True)

