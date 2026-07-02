import logging
import re
from datetime import date

from app.services.scraper.base_scraper import HttpScraper, ScrapedJob

logger = logging.getLogger(__name__)


def _strip_html(html: str) -> str:
    """Remove tags HTML e limpa texto."""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs"
REMOTIVE_DAILY_LIMIT = 4


class RemotiveScraper(HttpScraper):
    """Scraper for Remotive API (free, no auth, max 4 req/day)."""

    platform = "remotive"
    _request_counts: dict[str, int] = {}

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        today = date.today().isoformat()
        count_today = self._request_counts.get(today, 0)

        if count_today >= REMOTIVE_DAILY_LIMIT:
            self.logger.warning("Remotive: daily rate limit reached, skipping")
            return []

        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])

        search_terms = (target_roles + keywords)[:3] if (target_roles or keywords) else ["developer"]
        search = " ".join(search_terms)

        params = {"search": search, "limit": 50}

        resp = await self.get_with_retry(REMOTIVE_API_URL, params=params)

        self._request_counts[today] = count_today + 1

        data = resp.json()
        jobs = []
        for item in data.get("jobs", []):
            job = ScrapedJob(
                title=item.get("title", ""),
                company=item.get("company_name", ""),
                location=item.get("candidate_required_location", ""),
                description=_strip_html(item.get("description") or "")[:1000],
                url=item.get("url", ""),
                platform="remotive",
                salary_range=item.get("salary") or None,
            )
            if job.title and job.company:
                jobs.append(job)

        self.logger.info(f"Remotive: found {len(jobs)} jobs")
        return jobs
