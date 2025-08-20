from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from selectolax.parser import HTMLParser

from .types import EventRaw, Location, make_event_id


def _first_text(tree: HTMLParser, selector: str) -> Optional[str]:
    node = tree.css_first(selector)
    if not node:
        return None
    txt = node.text().strip()
    return txt or None


def _first_attr(tree: HTMLParser, selector: str, attr: str) -> Optional[str]:
    node = tree.css_first(selector)
    if not node:
        return None
    val = node.attributes.get(attr)
    return val.strip() if val else None


def parse_example_site(html: str, url: str, provider: str, city: Optional[str] = None, state: Optional[str] = None,
                       start_iso: Optional[str] = None, end_iso: Optional[str] = None) -> List[EventRaw]:
    """
    Very simple example parser:
    - title from h1 or meta[property="og:title"]
    - description from meta[name="description"] or first p
    - no CEUs inferred; no cost; location optional via args
    """
    tree = HTMLParser(html)
    title = (
        _first_text(tree, "h1")
        or _first_attr(tree, 'meta[property="og:title"]', "content")
        or _first_text(tree, "title")
        or url
    )
    desc = (
        _first_attr(tree, 'meta[name="description"]', "content")
        or _first_text(tree, "main p")
        or _first_text(tree, "p")
    )

    # Use provided start time or default to today (date only) for deterministic IDs during tests
    if not start_iso:
        start_iso = datetime.utcnow().strftime("%Y-%m-%d")

    event_id = make_event_id(provider=provider, title=title, start_iso=start_iso, city=city)

    loc = None
    if city or state:
        loc = Location(city=city, state=state)

    ev = EventRaw(
        id=event_id,
        title=title,
        url=url,
        provider=provider,
        description=desc,
        start=start_iso,
        end=end_iso,
        location=loc,
        source_site=provider.lower().replace(" ", "-"),
    )
    return [ev]

