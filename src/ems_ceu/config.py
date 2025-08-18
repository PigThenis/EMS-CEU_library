from pydantic import BaseModel
import os

class Settings(BaseModel):
    # Firebase
    project_id: str | None = None
    storage_bucket: str | None = None

    # Networking
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    )
    max_concurrency: int = 4
    request_timeout_s: float = 20.0

    class Config:
        extra = "ignore"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            project_id=os.getenv("FIREBASE_PROJECT_ID"),
            storage_bucket=os.getenv("FIREBASE_STORAGE_BUCKET"),
        )

