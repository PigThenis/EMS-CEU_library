from __future__ import annotations

from typing import List, Optional
from urllib.parse import urljoin

from selectolax.parser import HTMLParser

from .types import EventRaw, Location, make_event_id


# Listing: discover detail URLs from the events page
# We try common WildApricot/association CMS patterns; adjust if needed after testing.

def list_urls(html: str, base_url: str) -> List[str]:
    tree = HTMLParser(html)
    urls: List[str] = []
    # Common selectors for event lists
    for sel in [
        "a.eventTitle, a.event-title, a.title, .event a[href]",  # generic
        "a[href*='/event-']",  # WildApricot style
        "li a[href]",
    ]:
        for a in tree.css(sel):
            href = a.attributes.get("href")
            if not href:
                continue
            full = urljoin(base_url, href)
            # Heuristics: avoid anchors and mailto, restrict to same host path
            if full.startswith("http") and "mailto:" not in full and "#" not in full:
                urls.append(full)
    # Dedup while preserving order
    seen = set()
    out: List[str] = []
    for u in urls:
        if u not in seen:
            out.append(u)
            seen.add(u)
    return out


# Detail parser: pull key fields from an event page

def parse_detail(html: str, url: str, provider: str = "TN EMS Providers") -> List[EventRaw]:
    tree = HTMLParser(html)
    title = None
    for sel in ["h1", ".event-title", ".page-title", "title"]:
        n = tree.css_first(sel)
        if n:
            t = n.text().strip()
            if t:
                title = t
                break
    title = title or url

    # Date/time block commonly in labels like "When" or in time tags
    start = None
    end = None
    for sel in ["time[datetime]", ".event-date time[datetime]"]:
        nodes = tree.css(sel)
        if nodes:
            # first time as start; second as end if present
            start = nodes[0].attributes.get("datetime") or nodes[0].text().strip()
            if len(nodes) > 1:
                end = nodes[1].attributes.get("datetime") or nodes[1].text().strip()
            break

    # Location text
    city = None
    state = None
    for sel in [".event-location", ".location", "[itemprop='address']", "address"]:
        n = tree.css_first(sel)
        if n:
            txt = n.text(separator=" ").strip()
            # crude city/state heuristic
            parts = [p.strip() for p in txt.replace("\n", " ").split(",")]
            if len(parts) >= 2:
                city = parts[-2] if not city else city
                state = parts[-1].split()[0]
            break

    # Description
    desc = None
    for sel in [".event-description", ".content", ".article", "main", "#content"]:
        n = tree.css_first(sel)
        if n:
            d = n.text().strip()
            if d and len(d) > 20:
                desc = d[:2000]
                break

    event_id = make_event_id(provider=provider, title=title, start_iso=start or "", city=city)
    loc = Location(city=city, state=state) if (city or state) else None

    ev = EventRaw(
        id=event_id,
        title=title,
        url=url,
        provider=provider,
        start=start,
        end=end,
        location=loc,
        description=desc,
        modality=None,
        ceus_total=None,
    )
    return [ev]

