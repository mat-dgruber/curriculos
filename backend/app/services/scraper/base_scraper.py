import logging
import random
from abc import ABC, abstractmethod

import httpx
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout


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
    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        ...


class PlaywrightScraper(ABC):
    """Base for scrapers needing a real browser."""

    platform: str = ""
    enabled: bool = True

    def __init__(self, headless: bool = True, slow_mo: int = 100):
        self.headless = headless
        self.slow_mo = slow_mo
        self.logger = logging.getLogger(self.__class__.__name__)
        self.browser: Browser | None = None
        self.page: Page | None = None

    async def __aenter__(self):
        self._pw = await async_playwright().start()
        self.browser = await self._pw.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo,
        )
        self.page = await self.browser.new_page()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.page:
            try:
                await self.page.close()
            except Exception:
                pass
            self.page = None
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self._pw:
            await self._pw.stop()
            self._pw = None

    @abstractmethod
    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        ...

    async def _safe_goto(self, url: str, timeout: int = 30000):
        try:
            await self.page.goto(url, timeout=timeout, wait_until="domcontentloaded")
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout navigating to {url}")
            raise
        except Exception as e:
            self.logger.error(f"Error navigating to {url}: {e}")
            raise

    async def _random_delay(self, min_sec: float = 1.0, max_sec: float = 3.0):
        delay = random.uniform(min_sec, max_sec)
        await self.page.wait_for_timeout(int(delay * 1000))

    async def _safe_click(self, selector: str, timeout: int = 10000):
        try:
            await self.page.click(selector, timeout=timeout)
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout clicking {selector}")
            raise

    async def _safe_fill(self, selector: str, value: str, timeout: int = 10000):
        try:
            await self.page.fill(selector, value, timeout=timeout)
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout filling {selector}")
            raise

    async def _safe_query_text(self, selector: str, default: str = "") -> str:
        try:
            el = await self.page.query_selector(selector)
            if el:
                return (await el.inner_text()).strip()
        except Exception:
            pass
        return default

    async def _safe_query_attr(self, selector: str, attr: str, default: str = "") -> str:
        try:
            el = await self.page.query_selector(selector)
            if el:
                val = await el.get_attribute(attr)
                return val.strip() if val else default
        except Exception:
            pass
        return default


# Backward compatibility alias
BaseScraper = PlaywrightScraper
