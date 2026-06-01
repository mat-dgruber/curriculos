import json
import logging
import asyncio
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.config import settings
from app.models.job import Job
from app.models.profile import CandidateProfile
from app.services.scraper.gupy_scraper import GupyScraper
from app.services.scraper.linkedin_scraper import LinkedInScraper
from app.services.scraper.vagas_scraper import VagasScraper
from app.services.scraper.jooble_scraper import JoobleScraper
from app.services.scraper.adzuna_scraper import AdzunaScraper
from app.services.matcher import match_jobs

logger = logging.getLogger(__name__)


async def run_scan() -> dict:
    """
    Execute full scan: run all scrapers, match against profile, save new jobs to DB.
    Returns summary of results.
    """
    async with async_session() as db:
        # Get candidate profile
        result = await db.execute(select(CandidateProfile).limit(1))
        profile = result.scalar_one_or_none()

        if not profile:
            logger.warning("No candidate profile found. Scan skipped.")
            return {"new_jobs": 0, "total_scraped": 0, "error": "No profile configured"}

        keywords = profile.get_keywords_list()
        target_roles = profile.get_target_roles_list()
        preferred_locations = profile.get_preferred_locations_list()

        search_params = {
            "keywords": keywords,
            "location": preferred_locations[0] if preferred_locations else "",
        }

        # Run scrapers concurrently
        scrapers = [
            GupyScraper(headless=settings.playwright_headless, slow_mo=settings.playwright_slow_mo),
            LinkedInScraper(headless=settings.playwright_headless, slow_mo=settings.playwright_slow_mo),
            VagasScraper(headless=settings.playwright_headless, slow_mo=settings.playwright_slow_mo),
            JoobleScraper(api_key=settings.jooble_api_key),
            AdzunaScraper(app_id=settings.adzuna_app_id, app_key=settings.adzuna_app_key),
        ]

        all_scraped = []
        for scraper in scrapers:
            try:
                async with scraper:
                    scraped = await scraper.scrape(search_params)
                    all_scraped.extend(scraped)
            except Exception as e:
                logger.error(f"Scraper {scraper.__class__.__name__} failed: {e}")

        if not all_scraped:
            return {"new_jobs": 0, "total_scraped": 0, "message": "No jobs found"}

        # Match and score
        scored = match_jobs(all_scraped, target_roles, keywords, preferred_locations)

        # Get existing URLs to avoid duplicates
        existing_urls_result = await db.execute(select(Job.url))
        existing_urls = {row[0] for row in existing_urls_result.all()}

        # Save new jobs
        new_count = 0
        for scraped_job, score in scored:
            if scraped_job.url in existing_urls:
                continue

            job = Job(
                title=scraped_job.title,
                company=scraped_job.company,
                location=scraped_job.location,
                platform=scraped_job.platform,
                url=scraped_job.url,
                description=scraped_job.description,
                requirements=json.dumps(scraped_job.requirements) if scraped_job.requirements else None,
                salary_range=scraped_job.salary_range,
                score=score,
                status="Nova",
                found_at=datetime.utcnow(),
            )
            db.add(job)
            new_count += 1

        await db.commit()

        result = {
            "new_jobs": new_count,
            "total_scraped": len(all_scraped),
            "unique_scored": len(scored),
            "platforms": {
                "gupy": len([j for j in all_scraped if j.platform == "gupy"]),
                "linkedin": len([j for j in all_scraped if j.platform == "linkedin"]),
                "vagas": len([j for j in all_scraped if j.platform == "vagas"]),
                "jooble": len([j for j in all_scraped if j.platform == "jooble"]),
                "adzuna": len([j for j in all_scraped if j.platform == "adzuna"]),
            },
        }
        logger.info(f"Scan complete: {result}")
        return result
