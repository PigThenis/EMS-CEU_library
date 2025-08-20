from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx


@dataclass
class BrowserSession:
    base_url: str
    session_id: str

    async def navigate(self, url: str, wait_until: str = "domcontentloaded", timeout_ms: int = 30000) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout_ms / 1000 + 5) as client:
            r = await client.post(
                "/navigate",
                json={"sessionId": self.session_id, "url": url, "waitUntil": wait_until, "timeoutMs": timeout_ms},
            )
            r.raise_for_status()
            return r.json()

    async def wait_for(self, selector: str, timeout_ms: int = 15000, state: str = "attached") -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout_ms / 1000 + 5) as client:
            r = await client.post(
                "/waitFor",
                json={"sessionId": self.session_id, "selector": selector, "timeoutMs": timeout_ms, "state": state},
            )
            r.raise_for_status()
            return r.json()

    async def get_content(self, format: str = "html", timeout_s: int = 30) -> str:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout_s) as client:
            r = await client.get("/content", params={"sessionId": self.session_id, "format": format})
            r.raise_for_status()
            return r.text

    async def evaluate(self, function_body: str, args: Optional[list] = None, timeout_s: int = 30) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout_s) as client:
            r = await client.post(
                "/evaluate",
                json={"sessionId": self.session_id, "functionBody": function_body, "args": args or []},
            )
            r.raise_for_status()
            return r.json()

    async def screenshot(self, full_page: bool = False, selector: Optional[str] = None, type_: str = "png", timeout_s: int = 60) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout_s) as client:
            r = await client.post(
                "/screenshot",
                json={"sessionId": self.session_id, "fullPage": full_page, "selector": selector, "type": type_},
            )
            r.raise_for_status()
            return r.json()

    async def close(self) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=10) as client:
            r = await client.post("/close", json={"sessionId": self.session_id})
            r.raise_for_status()
            return r.json()


class BrowserClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8787") -> None:
        self.base_url = base_url.rstrip("/")

    async def new_session(self) -> BrowserSession:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            r = await client.post("/session", json={})
            r.raise_for_status()
            data = r.json()
            return BrowserSession(base_url=self.base_url, session_id=data["sessionId"])
