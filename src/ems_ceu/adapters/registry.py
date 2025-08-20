from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List, Optional

from ems_ceu.adapters.example_site import parse_example_site
from ems_ceu.adapters.types import EventRaw
from ems_ceu.adapters import tnemsproviders, aha

# Function signatures
ParseDetailFn = Callable[..., List[EventRaw]]
ListUrlsFn = Callable[[str, str], List[str]] # (html, url) -> list of detail urls


@dataclass
class Adapter:
    parse_detail: ParseDetailFn
    list_urls: Optional[ListUrlsFn] = None


ADAPTERS: Dict[str, Adapter] = {
    # Placeholder mappings use the example parser for detail pages
    "example": Adapter(parse_detail=parse_example_site),
    "distancecme": Adapter(parse_detail=parse_example_site),
    # Real adapter for TN EMS Providers: list + detail
    "tnemsproviders": Adapter(parse_detail=tnemsproviders.parse_detail, list_urls=tnemsproviders.list_urls),
    "emsworldexpo": Adapter(parse_detail=parse_example_site),
    # AHA adapter: list + detail (requires browser in most cases; use job.wait_for)
    "aha": Adapter(parse_detail=aha.parse_detail, list_urls=aha.list_urls),
}


def register_adapter(name: str, adapter: Adapter) -> None:
    ADAPTERS[name] = adapter


def get_adapter(name: str) -> Adapter:
    if name not in ADAPTERS:
        raise KeyError(f"Unknown adapter: {name}")
    return ADAPTERS[name]
