from app.services.scraper.base_scraper import BaseScraper, ScrapedJob
from app.services.scraper.gupy_scraper import GupyScraper
from app.services.scraper.linkedin_scraper import LinkedInScraper
from app.services.scraper.vagas_scraper import VagasScraper
from app.services.scraper.jooble_scraper import JoobleScraper
from app.services.scraper.adzuna_scraper import AdzunaScraper

__all__ = [
    "BaseScraper",
    "ScrapedJob",
    "GupyScraper",
    "LinkedInScraper",
    "VagasScraper",
    "JoobleScraper",
    "AdzunaScraper",
]
