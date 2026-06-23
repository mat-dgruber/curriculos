import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from app.core.config import settings
from app.services.scraper.base_scraper import ScrapedJob
from app.services.scraper import rate_limiter


class ScraperStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    SKIPPED = "skipped"


@dataclass
class ScraperResult:
    platform: str
    status: ScraperStatus = ScraperStatus.PENDING
    jobs: list[ScrapedJob] = field(default_factory=list)
    error: str | None = None
    duration_seconds: float = 0.0

    @property
    def jobs_found(self) -> int:
        return len(self.jobs)


@dataclass
class OrchestratorResult:
    total_scraped: int = 0
    platforms: dict[str, ScraperResult] = field(default_factory=dict)
    all_jobs: list[ScrapedJob] = field(default_factory=list)

    @property
    def summary(self) -> dict:
        return {
            "total_scraped": self.total_scraped,
            "platforms": {
                name: {
                    "status": r.status.value,
                    "jobs_found": r.jobs_found,
                    "error": r.error,
                    "duration": round(r.duration_seconds, 2),
                }
                for name, r in self.platforms.items()
            },
        }


class ScraperOrchestrator:
    """Coordinates all scrapers: concurrent execution, error isolation, status tracking."""

    def __init__(self, enabled_platforms: set[str] | None = None):
        self.logger = logging.getLogger("ScraperOrchestrator")
        self._enabled_platforms = enabled_platforms
        self._scrapers: dict[str, type] = {}
        self._register_defaults()

    def _register_defaults(self):
        from app.services.scraper.gupy_scraper import GupyScraper
        from app.services.scraper.linkedin_scraper import LinkedInScraper
        from app.services.scraper.vagas_scraper import VagasScraper
        from app.services.scraper.jooble_scraper import JoobleScraper
        from app.services.scraper.adzuna_scraper import AdzunaScraper
        from app.services.scraper.remotive_scraper import RemotiveScraper
        from app.services.scraper.infojobs_scraper import InfoJobsScraper
        from app.services.scraper.catho_scraper import CathoScraper

        self._scrapers = {
            "gupy": GupyScraper,
            "linkedin": LinkedInScraper,
            "vagas": VagasScraper,
            "jooble": JoobleScraper,
            "adzuna": AdzunaScraper,
            "remotive": RemotiveScraper,
            "infojobs": InfoJobsScraper,
            "catho": CathoScraper,
        }

    def _build_scraper(self, platform: str):
        cls = self._scrapers[platform]

        if platform == "jooble":
            return cls(api_key=settings.jooble_api_key)
        elif platform == "adzuna":
            return cls(app_id=settings.adzuna_app_id, app_key=settings.adzuna_app_key)
        elif platform in ("gupy", "remotive"):
            return cls()
        else:
            return cls(headless=settings.playwright_headless, slow_mo=settings.playwright_slow_mo)

    def _should_run(self, platform: str) -> bool:
        if platform not in self._scrapers:
            return False
        if self._enabled_platforms is not None and platform not in self._enabled_platforms:
            return False
        if settings.enabled_scrapers:
            allowed = {s.strip() for s in settings.enabled_scrapers.split(",")}
            if platform not in allowed:
                return False
        if not rate_limiter.can_run(platform):
            return False
        return True

    async def _run_single(self, platform: str, search_params: dict) -> ScraperResult:
        if not self._should_run(platform):
            return ScraperResult(platform=platform, status=ScraperStatus.SKIPPED)

        scraper = self._build_scraper(platform)
        start = datetime.utcnow()

        try:
            async with scraper:
                jobs = await scraper.scrape(search_params)
                elapsed = (datetime.utcnow() - start).total_seconds()
                rate_limiter.record_run(platform)
                self.logger.info(f"[{platform}] {len(jobs)} jobs in {elapsed:.1f}s")
                return ScraperResult(
                    platform=platform,
                    status=ScraperStatus.SUCCESS,
                    jobs=jobs,
                    duration_seconds=elapsed,
                )
        except Exception as e:
            elapsed = (datetime.utcnow() - start).total_seconds()
            self.logger.error(f"[{platform}] Failed after {elapsed:.1f}s: {e}")
            return ScraperResult(
                platform=platform,
                status=ScraperStatus.ERROR,
                error=str(e),
                duration_seconds=elapsed,
            )

    async def run_all(self, search_params: dict) -> OrchestratorResult:
        platforms_to_run = [p for p in self._scrapers if self._should_run(p)]

        self.logger.info(f"Running {len(platforms_to_run)} scrapers sequentially: {platforms_to_run}")

        results = []
        for p in platforms_to_run:
            try:
                res = await self._run_single(p, search_params)
                results.append(res)
            except Exception as e:
                results.append(e)

        all_jobs: list[ScrapedJob] = []
        platform_results: dict[str, ScraperResult] = {}

        for platform, result in zip(platforms_to_run, results):
            if isinstance(result, Exception):
                platform_results[platform] = ScraperResult(
                    platform=platform,
                    status=ScraperStatus.ERROR,
                    error=str(result),
                )
            else:
                platform_results[platform] = result
                all_jobs.extend(result.jobs)

        return OrchestratorResult(
            total_scraped=len(all_jobs),
            platforms=platform_results,
            all_jobs=all_jobs,
        )
