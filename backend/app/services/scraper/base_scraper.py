import logging
import random
from abc import ABC, abstractmethod

import httpx
from playwright.async_api import (
    async_playwright,
    Browser,
    Page,
    TimeoutError as PlaywrightTimeout,
)


class ScrapedJob:
    """Job data extracted from a platform."""

    def __init__(
        self,
        title: str,
        company: str,
        location: str,
        description: str,
        url: str,
        platform: str,
        salary_range: str | None = None,
        requirements: list[str] | None = None,
    ):
        self.title = title
        self.company = company
        self.location = location
        self.description = description
        self.url = url
        self.platform = platform
        self.salary_range = salary_range
        self.requirements = requirements or []


import asyncio


class HttpScraper(ABC):
    """Base for API/HTTP scrapers. No Playwright overhead."""

    platform: str = ""
    enabled: bool = True

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
            self._client = None

    @abstractmethod
    async def scrape(self, search_params: dict) -> list[ScrapedJob]: ...

    async def get_with_retry(self, url: str, **kwargs) -> httpx.Response:
        """Fetch using client.get with retry logic and exponential backoff."""
        retries = 3
        backoff = 2
        for attempt in range(retries):
            try:
                resp = await self._client.get(url, **kwargs)
                resp.raise_for_status()
                return resp
            except Exception as e:
                self.logger.warning(
                    f"HTTP GET failed (attempt {attempt+1}/{retries}) for {url}: {e}"
                )
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(backoff**attempt + random.uniform(0.5, 1.5))


class ScraplingScraper(ABC):
    """Base for scrapers using the Scrapling framework."""

    platform: str = ""
    enabled: bool = True

    def __init__(self, use_stealth: bool = True, headless: bool = True):
        self.use_stealth = use_stealth
        self.headless = headless
        self.logger = logging.getLogger(self.__class__.__name__)
        self.session = None

    async def __aenter__(self):
        from scrapling.fetchers import AsyncStealthySession, AsyncDynamicSession
        from app.core.config import settings

        session_cls = AsyncStealthySession if self.use_stealth else AsyncDynamicSession

        kwargs = {"headless": self.headless}
        if settings.scraper_proxy:
            kwargs["proxy"] = settings.scraper_proxy

        self.session = session_cls(**kwargs)
        await self.session.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.__aexit__(exc_type, exc_val, exc_tb)
            self.session = None

    @abstractmethod
    async def scrape(self, search_params: dict) -> list[ScrapedJob]: ...

    async def _fetch(self, url: str, **kwargs):
        """Fetch page dynamically using the current Scrapling session with retries."""
        if not self.session:
            raise RuntimeError(
                "Scrapling session not started. Use 'async with' context manager."
            )
        options = {
            "network_idle": True,
            "timeout": 30000,
        }
        options.update(kwargs)

        retries = 3
        backoff = 2
        last_exception = None
        for attempt in range(retries):
            try:
                self.logger.debug(f"Fetching {url} (attempt {attempt+1}/{retries})")
                return await self.session.fetch(url, **options)
            except Exception as e:
                last_exception = e
                self.logger.warning(
                    f"Fetch failed (attempt {attempt+1}/{retries}) for {url}: {e}"
                )
                if attempt < retries - 1:
                    await asyncio.sleep(backoff**attempt + random.uniform(0.5, 1.5))

        if last_exception is not None:
            raise last_exception
        raise RuntimeError(
            "Fetch failed: session returned empty or failed to initialize."
        )


# Backward compatibility aliases
PlaywrightScraper = ScraplingScraper
BaseScraper = ScraplingScraper
