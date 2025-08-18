from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx
from selectolax.parser import HTMLParser

from .mcp_client import BrowserClient


@dataclass
class Field:
    name: str
    selector: str  # CSS selector
    attr: Optional[str] = None  # e.g., 'href'; if None, take text


@dataclass
class Template:
    start_url: str
    wait_for: Optional[str] = None
    fields: List[Field] | None = None


async def try_http_fetch(url: str, timeout_s: int = 20) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            r = await client.get(url, headers={"User-Agent": "ems-ceu-bot/0.1"})
            if r.status_code >= 400:
                return None
            # Heuristic: if content looks empty of meaningful text, fall back
            if len(r.text) < 500:
                return None
            return r.text
    except Exception:
        return None


def extract_fields(html: str, fields: List[Field]) -> Dict[str, List[str]]:
    tree = HTMLParser(html)
    out: Dict[str, List[str]] = {}
    for f in fields:
        nodes = tree.css(f.selector)
        values: List[str] = []
        for n in nodes:
            if f.attr:
                val = n.attributes.get(f.attr)
                if val:
                    values.append(val.strip())
            else:
                txt = n.text().strip()
                if txt:
                    values.append(txt)
        out[f.name] = values
    return out


async def render_and_extract(tpl: Template, browser_base_url: str = "http://127.0.0.1:8787") -> Dict[str, Any]:
    # First attempt plain HTTP fetch
    html = await try_http_fetch(tpl.start_url)
    if html and (tpl.fields or tpl.wait_for):
        return {
            "source": "httpx",
            "url": tpl.start_url,
            "fields": extract_fields(html, tpl.fields or []),
            "html": html,
        }
    elif html:
        return {"source": "httpx", "url": tpl.start_url, "html": html}

    # Fallback to browser service
    bc = BrowserClient(base_url=browser_base_url)
    session = await bc.new_session()
    try:
        await session.navigate(tpl.start_url)
        if tpl.wait_for:
            await session.wait_for(tpl.wait_for)
        html = await session.get_content(format="html")
        return {
            "source": "browser",
            "url": tpl.start_url,
            "fields": extract_fields(html, tpl.fields or []),
            "html": html,
        }
    finally:
        await session.close()


# Convenience CLI for quick manual tests
if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--wait-for")
    parser.add_argument("--browser", default="http://127.0.0.1:8787")
    parser.add_argument("--field", action="append", help="name:selector[:attr]")
    args = parser.parse_args()

    fields: List[Field] = []
    if args.field:
        for f in args.field:
            parts = f.split(":")
            if len(parts) == 2:
                name, selector = parts
                fields.append(Field(name=name, selector=selector))
            elif len(parts) == 3:
                name, selector, attr = parts
                fields.append(Field(name=name, selector=selector, attr=attr))

    tpl = Template(start_url=args.url, wait_for=args.wait_for, fields=fields)

    result = asyncio.run(render_and_extract(tpl, browser_base_url=args.browser))
    print(json.dumps(result, ensure_ascii=False)[:2000])

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx
from selectolax.parser import HTMLParser

from .mcp_client import BrowserClient


@dataclass
class Field:
    name: str
    selector: str  # CSS selector
    attr: Optional[str] = None  # e.g., 'href'; if None, take text


@dataclass
class Template:
    start_url: str
    wait_for: Optional[str] = None
    fields: List[Field] = None


async def try_http_fetch(url: str, timeout_s: int = 20) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            r = await client.get(url, headers={"User-Agent": "ems-ceu-bot/0.1"})
            if r.status_code >= 400:
                return None
            # Heuristic: if content looks empty of meaningful text, fall back
            if len(r.text) < 500:
                return None
            return r.text
    except Exception:
        return None


def extract_fields(html: str, fields: List[Field]) -> Dict[str, List[str]]:
    tree = HTMLParser(html)
    out: Dict[str, List[str]] = {}
    for f in fields:
        nodes = tree.css(f.selector)
        values: List[str] = []
        for n in nodes:
            if f.attr:
                val = n.attributes.get(f.attr)
                if val:
                    values.append(val.strip())
            else:
                txt = n.text().strip()
                if txt:
                    values.append(txt)
        out[f.name] = values
    return out


async def render_and_extract(tpl: Template, browser_base_url: str = "http://127.0.0.1:8787") -> Dict[str, Any]:
    # First attempt plain HTTP fetch
    html = await try_http_fetch(tpl.start_url)
    if html:
        return {
            "source": "httpx",
            "url": tpl.start_url,
            "fields": extract_fields(html, tpl.fields or []),
            "html": html,
        }

    # Fallback to browser service
    bc = BrowserClient(base_url=browser_base_url)
    session = await bc.new_session()
    try:
        await session.navigate(tpl.start_url)
        if tpl.wait_for:
            await session.wait_for(tpl.wait_for)
        html = await session.get_content(format="html")
        return {
            "source": "browser",
            "url": tpl.start_url,
            "fields": extract_fields(html, tpl.fields or []),
            "html": html,
        }
    finally:
        await session.close()


# Convenience CLI for quick manual tests
if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--wait-for")
    parser.add_argument("--browser", default="http://127.0.0.1:8787")
    parser.add_argument("--field", action="append", help="name:selector[:attr]")
    args = parser.parse_args()

    fields: List[Field] = []
    if args.field:
        for f in args.field:
            parts = f.split(":")
            if len(parts) == 2:
                name, selector = parts
                fields.append(Field(name=name, selector=selector))
            elif len(parts) == 3:
                name, selector, attr = parts
                fields.append(Field(name=name, selector=selector, attr=attr))

    tpl = Template(start_url=args.url, wait_for=args.wait_for, fields=fields)

    result = asyncio.run(render_and_extract(tpl, browser_base_url=args.browser))
    print(json.dumps(result, ensure_ascii=False)[:2000])
