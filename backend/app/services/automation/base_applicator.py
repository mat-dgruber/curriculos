import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime

from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout


@dataclass
class ApplicationResult:
    success: bool
    status: str  # "Enviado" | "Falhou"
    screenshot_path: str | None = None
    error_message: str | None = None
    platform: str = ""


class BaseApplicator(ABC):
    """Base class for all job application automators."""

    def __init__(
        self,
        headless: bool = True,
        slow_mo: int = 100,
        screenshots_path: str = "./storage/screenshots",
        cv_path: str | None = None,
    ):
        self.headless = headless
        self.slow_mo = slow_mo
        self.screenshots_path = screenshots_path
        self.cv_path = cv_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.browser: Browser | None = None
        self.page: Page | None = None
        self.profile: dict = {}

    async def __aenter__(self):
        self._pw = await async_playwright().start()
        self.browser = await self._pw.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo,
        )
        self.page = await self.browser.new_page()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        if self._pw:
            await self._pw.stop()

    @abstractmethod
    async def apply(self, job_url: str, job_title: str, company_name: str) -> ApplicationResult:
        """Apply to a job. Must be implemented by subclasses."""
        ...

    async def _take_screenshot(self, label: str, success: bool = True) -> str:
        """Take screenshot and return path."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        status = "success" if success else "fail"
        filename = f"{label}_{status}_{timestamp}.png"
        path = os.path.join(self.screenshots_path, filename)

        os.makedirs(self.screenshots_path, exist_ok=True)
        await self.page.screenshot(path=path)
        self.logger.info(f"Screenshot saved: {path}")
        return path

    async def _safe_goto(self, url: str, timeout: int = 30000):
        try:
            await self.page.goto(url, timeout=timeout, wait_until="domcontentloaded")
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout navigating to {url}")
            raise

    async def _random_delay(self, min_sec: float = 1.0, max_sec: float = 3.0):
        import random
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
