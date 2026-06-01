import json
import logging
from datetime import datetime

from sqlalchemy import select

from app.core.database import async_session
from app.models.job import Job
from app.models.profile import CandidateProfile
from app.models.rejected_job import RejectedJob
from app.services.scraper.orchestrator import ScraperOrchestrator
from app.services.matcher import match_jobs

logger = logging.getLogger(__name__)

MIN_SCORE = 20


async def run_scan() -> dict:
    """
    Execute full scan: run all scrapers concurrently, match against profile, save new jobs to DB.
    Returns summary of results.
    """
    async with async_session() as db:
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
            "title": target_roles,
            "location": preferred_locations,
        }

        orchestrator = ScraperOrchestrator()
        scan_result = await orchestrator.run_all(search_params)

        all_scraped = scan_result.all_jobs

        if not all_scraped:
            return {
                "new_jobs": 0,
                "total_scraped": 0,
                "platforms": scan_result.summary["platforms"],
            }

        scored = match_jobs(all_scraped, target_roles, keywords, preferred_locations)

        # Filter by minimum score
        scored = [(j, s) for j, s in scored if s >= MIN_SCORE]

        # Get existing URLs (from jobs table AND rejected_jobs table)
        existing_urls_result = await db.execute(select(Job.url))
        existing_urls = {row[0] for row in existing_urls_result.all()}

        rejected_urls_result = await db.execute(select(RejectedJob.url))
        rejected_urls = {row[0] for row in rejected_urls_result.all()}

        excluded_urls = existing_urls | rejected_urls

        new_count = 0
        for scraped_job, score in scored:
            if scraped_job.url in excluded_urls:
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
            excluded_urls.add(scraped_job.url)
            new_count += 1

        await db.commit()

        scan_summary = {
            "new_jobs": new_count,
            "total_scraped": scan_result.total_scraped,
            "unique_scored": len(scored),
            "platforms": scan_result.summary["platforms"],
        }
        logger.info(f"Scan complete: {scan_summary}")
        return scan_summary
