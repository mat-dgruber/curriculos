import logging

from app.services.scraper.base_scraper import ScrapedJob

logger = logging.getLogger(__name__)

REMOTE_KEYWORDS = ["remoto", "remote", "home office", "teletrabalho", "distancial"]


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
    - Keywords in description: up to 35 points (7 per keyword, max 5)
    - Location match: 15 points (includes "Remoto" auto-match)
    - Trusted platform bonus: 5 points
    - Penalty: -20 if ZERO keywords match
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

    # Keywords in description (up to 35 points)
    kw_count = 0
    kw_matched = False
    for kw in keywords:
        if kw.lower() in desc_lower or kw.lower() in title_lower:
            score += 7
            kw_count += 1
            kw_matched = True
            if kw_count >= 5:
                break

    # Penalty if no keyword matched at all
    if keywords and not kw_matched:
        score -= 20

    # Location match (15 points) — includes auto "Remoto" match
    user_locations_lower = [loc.lower() for loc in preferred_locations]
    is_user_looking_remote = any(rk in " ".join(user_locations_lower) for rk in REMOTE_KEYWORDS)

    location_matched = False
    for loc in preferred_locations:
        if loc.lower() in location_lower or location_lower in loc.lower():
            score += 15
            location_matched = True
            break

    # Auto "Remoto" bonus: if user wants remote and job is remote
    if not location_matched and is_user_looking_remote:
        if any(rk in location_lower for rk in REMOTE_KEYWORDS):
            score += 15

    # Trusted platform bonus (5 points)
    if job.platform in ("linkedin", "gupy", "infojobs", "catho"):
        score += 5

    return max(min(score, 100), 0)


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
    from app.services.ai_matcher import get_ai_score
    scored = []
    for job in scraped_jobs:
        heuristic_s = calculate_score(job, target_roles, keywords, preferred_locations)
        s = get_ai_score(job, heuristic_s, preferred_locations)
        scored.append((job, s))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored
