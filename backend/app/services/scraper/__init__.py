from app.services.scraper.base_scraper import BaseScraper, ScrapedJob
from app.services.scraper.gupy_scraper import GupyScraper
from app.services.scraper.linkedin_scraper import LinkedInScraper
from app.services.scraper.vagas_scraper import VagasScraper

__all__ = [
    "BaseScraper",
    "ScrapedJob",
    "GupyScraper",
    "LinkedInScraper",
    "VagasScraper",
]
