import logging
import json

from app.services.scraper.base_scraper import ScrapedJob

logger = logging.getLogger(__name__)


def calculate_score(
    job: ScrapedJob,
    target_roles: list[str],
    keywords: list[str],
    preferred_locations: list[str],
) -> int:
    """
    Calculate compatibility score (0-100) between a scraped job and candidate profile.

    Score breakdown:
    - Role match in title: 40 points
    - Keywords in description: up to 30 points (6 per keyword, max 5)
    - Location match: 20 points
    - Trusted platform bonus: 10 points
    """
    score = 0
    title_lower = job.title.lower()
    desc_lower = (job.description or "").lower()
    location_lower = job.location.lower()

    # Role match in title (40 points)
    for role in target_roles:
        if role.lower() in title_lower:
            score += 40
            break

    # Keywords in description (up to 30 points)
    kw_count = 0
    for kw in keywords:
        if kw.lower() in desc_lower or kw.lower() in title_lower:
            score += 6
            kw_count += 1
            if kw_count >= 5:
                break

    # Location match (20 points)
    for loc in preferred_locations:
        if loc.lower() in location_lower or location_lower in loc.lower():
            score += 20
            break

    # Trusted platform bonus (10 points)
    if job.platform in ("linkedin", "gupy"):
        score += 10

    return min(score, 100)


def match_jobs(
    scraped_jobs: list[ScrapedJob],
    target_roles: list[str],
    keywords: list[str],
    preferred_locations: list[str],
) -> list[tuple[ScrapedJob, int]]:
    """
    Score all scraped jobs against candidate profile.
    Returns list of (job, score) tuples sorted by score descending.
    """
    scored = []
    for job in scraped_jobs:
        score = calculate_score(job, target_roles, keywords, preferred_locations)
        scored.append((job, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored
