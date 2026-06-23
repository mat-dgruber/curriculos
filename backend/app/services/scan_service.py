import json
import logging
import re
import unicodedata
from datetime import datetime

from sqlalchemy import select

from app.core.database import async_session
from app.models.job import Job
from app.models.profile import CandidateProfile
from app.models.rejected_job import RejectedJob
from app.services.scraper.orchestrator import ScraperOrchestrator
from app.services.matcher import match_jobs

logger = logging.getLogger(__name__)


def _canonical_url(url: str) -> str:
    """Strip tracking query params from URL to get stable identifier."""
    if not url:
        return url
    # Remove query string and fragment (LinkedIn adds ?position=N&pa=... per keyword)
    base = re.split(r'[?#]', url)[0].rstrip('/')
    return base


def _job_fingerprint(title: str, company: str) -> str:
    """Normalize title+company for fuzzy dedup (case/accent insensitive)."""
    def norm(s: str) -> str:
        s = s.lower().strip()
        # Remove accents
        s = unicodedata.normalize('NFD', s)
        s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
        # Collapse whitespace
        return re.sub(r'\s+', ' ', s)
    return f"{norm(title)}|{norm(company)}"

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
            "keywords": keywords,                            # for description matching in matcher
            "title": target_roles,                           # for scraper search terms (what to search for)
            "location": preferred_locations,                 # full list for matching
            "location_str": preferred_locations[0] if preferred_locations else "Brasil",  # primary location string for URL builders
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

        # Get existing canonical URLs + fingerprints from DB
        existing_urls_result = await db.execute(select(Job.url, Job.title, Job.company))
        existing_rows = existing_urls_result.all()
        excluded_canonical_urls: set[str] = {_canonical_url(row[0]) for row in existing_rows}
        excluded_fingerprints: set[str] = {_job_fingerprint(row[1], row[2]) for row in existing_rows}

        rejected_urls_result = await db.execute(select(RejectedJob.url))
        rejected_canonical_urls = {_canonical_url(row[0]) for row in rejected_urls_result.all()}
        excluded_canonical_urls |= rejected_canonical_urls

        # In-memory set to dedup within this batch
        batch_canonical_urls: set[str] = set()
        batch_fingerprints: set[str] = set()

        new_count = 0
        skipped_dup = 0
        for scraped_job, score in scored:
            canonical = _canonical_url(scraped_job.url)
            fingerprint = _job_fingerprint(scraped_job.title, scraped_job.company)

            # Skip if already in DB (by canonical URL or title+company)
            if canonical in excluded_canonical_urls or fingerprint in excluded_fingerprints:
                skipped_dup += 1
                continue
            # Skip if already queued in this batch
            if canonical in batch_canonical_urls or fingerprint in batch_fingerprints:
                skipped_dup += 1
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
            batch_canonical_urls.add(canonical)
            batch_fingerprints.add(fingerprint)
            new_count += 1

        if skipped_dup:
            logger.info(f"Scan: skipped {skipped_dup} duplicate jobs (URL or title+company match)")
        await db.commit()

        scan_summary = {
            "new_jobs": new_count,
            "total_scraped": scan_result.total_scraped,
            "unique_scored": len(scored),
            "duplicates_skipped": skipped_dup,
            "platforms": scan_result.summary["platforms"],
        }
        logger.info(f"Scan complete: {scan_summary}")
        return scan_summary
