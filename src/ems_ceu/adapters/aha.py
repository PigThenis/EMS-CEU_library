from __future__ import annotations

from typing import List, Optional
from urllib.parse import urljoin
import re

from selectolax.parser import HTMLParser

from .types import EventRaw, Location, make_event_id


# AHA pages are dynamic; list_urls is used after browser-rendered HTML is captured.

def list_urls(html: str, base_url: str) -> List[str]:
    tree = HTMLParser(html)
    urls: List[str] = []

    # Candidate selectors for course/result cards that link to detail pages
    selectors = [
        "a[href*='/en/courses/']",
        "a[href*='/find-a-course/']",
        ".card a[href]",
        "article a[href]",
    ]
    for sel in selectors:
        for a in tree.css(sel):
            href = a.attributes.get("href")
            if not href:
                continue
            full = urljoin(base_url, href)
            if full.startswith("http") and "mailto:" not in full and "#" not in full:
                urls.append(full)

    # Deduplicate while preserving order
    seen = set()
    out: List[str] = []
    for u in urls:
        if u not in seen:
            out.append(u)
            seen.add(u)
    return out


def _text(tree: HTMLParser, selectors: List[str]) -> Optional[str]:
    for sel in selectors:
        n = tree.css_first(sel)
        if n:
            t = n.text().strip()
            if t:
                return t
    return None


def _attr(tree: HTMLParser, selector: str, attr: str) -> Optional[str]:
    n = tree.css_first(selector)
    if n:
        v = n.attributes.get(attr)
        return v.strip() if v else None
    return None


def _find_price(text: str) -> Optional[float]:
    m = re.search(r"\$\s*([0-9]+(?:\.[0-9]{1,2})?)", text)
    if m:
        try:
            return float(m.group(1))
        except Exception:
            return None
    return None


def parse_detail(html: str, url: str, provider: str = "AHA") -> List[EventRaw]:
    tree = HTMLParser(html)

    title = _text(tree, [
        "h1",
        "[data-qa='course-title']",
        "title",
    ]) or "AHA Course"

    # Modality hints
    modality_txt = _text(tree, [
        "[data-qa='modality']",
        ".modality",
        "main",
    ])
    modality = None
    if modality_txt:
        low = modality_txt.lower()
        if "online" in low and ("self" in low or "on-demand" in low):
            modality = "virtual_on_demand"
        elif "blended" in low or "hybrid" in low:
            modality = "hybrid"
        elif "virtual" in low or "instructor-led online" in low:
            modality = "virtual_live"
        elif "classroom" in low or "in-person" in low:
            modality = "in_person"

    # Dates/times (best effort; details vary per page)
    start = None
    end = None
    times = tree.css("time[datetime]")
    if times:
        start = times[0].attributes.get("datetime") or times[0].text().strip()
        if len(times) > 1:
            end = times[1].attributes.get("datetime") or times[1].text().strip()

    # Location block (if in-person/hybrid)
    city = None
    state = None
    location_txt = _text(tree, [".location", "[data-qa='location']", "address", "[itemprop='address']"]) or ""
    if location_txt:
        parts = [p.strip() for p in location_txt.replace("\n", " ").split(",")]
        if len(parts) >= 2:
            city = parts[-2]
            state = parts[-1].split()[0]

    # Price
    body_text = tree.body.text(separator=" ").strip() if tree.body else ""
    price = _find_price(body_text)

    # Description
    description = _text(tree, [
        "[data-qa='description']",
        "section[aria-label='Description']",
        "main",
    ])

    event_id = make_event_id(provider=provider, title=title, start_iso=start or "", city=city)
    loc = Location(city=city, state=state) if (city or state) else None

    ev = EventRaw(
        id=event_id,
        title=title,
        url=url,
        provider=provider,
        modality=modality,
        start=start,
        end=end,
        location=loc,
        cost=price,
        currency="USD" if price is not None else None,
        description=description,
        source_site="aha",
    )
    return [ev]

