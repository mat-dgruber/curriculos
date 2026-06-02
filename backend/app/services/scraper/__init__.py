from app.services.scraper.base_scraper import (
    BaseScraper,
    HttpScraper,
    PlaywrightScraper,
    ScrapedJob,
)
from app.services.scraper.gupy_scraper import GupyScraper
from app.services.scraper.linkedin_scraper import LinkedInScraper
from app.services.scraper.vagas_scraper import VagasScraper
from app.services.scraper.jooble_scraper import JoobleScraper
from app.services.scraper.adzuna_scraper import AdzunaScraper
from app.services.scraper.remotive_scraper import RemotiveScraper
from app.services.scraper.infojobs_scraper import InfoJobsScraper
from app.services.scraper.catho_scraper import CathoScraper
from app.services.scraper.orchestrator import ScraperOrchestrator, OrchestratorResult, ScraperResult, ScraperStatus

__all__ = [
    "BaseScraper",
    "HttpScraper",
    "PlaywrightScraper",
    "ScrapedJob",
    "GupyScraper",
    "LinkedInScraper",
    "VagasScraper",
    "JoobleScraper",
    "AdzunaScraper",
    "RemotiveScraper",
    "InfoJobsScraper",
    "CathoScraper",
    "ScraperOrchestrator",
    "OrchestratorResult",
    "ScraperResult",
    "ScraperStatus",
]
