from __future__ import annotations

import hashlib
import re
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


def _norm(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def make_event_id(provider: str, title: str, start_iso: str, city: Optional[str] = None) -> str:
    base = "|".join(
        [
            _norm(provider),
            _norm(title),
            _norm(start_iso),
            _norm(city) if city else "",
        ]
    )
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


class Location(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class EventBase(BaseModel):
    id: str
    title: str
    url: str
    provider: str

    modality: Optional[str] = Field(None, description="in-person|virtual|hybrid")
    start: Optional[str] = Field(None, description="ISO8601 start datetime")
    end: Optional[str] = Field(None, description="ISO8601 end datetime")
    timezone: Optional[str] = None

    location: Optional[Location] = None

    cost: Optional[float] = None
    currency: Optional[str] = None

    ceus_total: Optional[float] = None
    ceu_breakdown: Dict[str, float] | None = None  # e.g., {"airway": 2.0}

    tags: List[str] | None = None
    description: Optional[str] = None

    raw_html_path: Optional[str] = Field(None, description="Storage path to raw HTML snapshot")

    updated_at: float = Field(default_factory=lambda: datetime.utcnow().timestamp())


class EventRaw(EventBase):
    source_site: Optional[str] = None
    fetched_at: float = Field(default_factory=lambda: datetime.utcnow().timestamp())


class Event(EventBase):
    # Post-AI/curated
    categories: List[str] | None = None
    quality_score: Optional[float] = None
    published_at: float = Field(default_factory=lambda: datetime.utcnow().timestamp())

