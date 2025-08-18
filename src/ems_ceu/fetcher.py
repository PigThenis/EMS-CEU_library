import asyncio
import hashlib
from typing import Optional

import httpx
from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential_jitter

from .config import Settings


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class FetchResult:
    def __init__(self, url: str, status_code: int, content: bytes, etag: Optional[str], last_modified: Optional[str]):
        self.url = url
        self.status_code = status_code
        self.content = content
        self.etag = etag
        self.last_modified = last_modified


class Fetcher:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or Settings.from_env()

    async def _client(self) -> httpx.AsyncClient:
        headers = {"User-Agent": self.settings.user_agent}
        timeout = httpx.Timeout(self.settings.request_timeout_s)
        return httpx.AsyncClient(headers=headers, http2=True, timeout=timeout, follow_redirects=True)

    async def fetch(self, url: str, etag: Optional[str] = None, last_modified: Optional[str] = None) -> FetchResult:
        async with await self._client() as client:
            req_headers = {}
            if etag:
                req_headers["If-None-Match"] = etag
            if last_modified:
                req_headers["If-Modified-Since"] = last_modified

            async for attempt in AsyncRetrying(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10)):
                with attempt:
                    resp = await client.get(url, headers=req_headers)
                    content = await resp.aread()
                    return FetchResult(
                        url=url,
                        status_code=resp.status_code,
                        content=content,
                        etag=resp.headers.get("ETag"),
                        last_modified=resp.headers.get("Last-Modified"),
                    )


