"""Arbeitnow scraper (free public API, no auth).

API: https://www.arbeitnow.com/api/job-board-api
Docs: free, no rate limit announced, public jobs (mostly EU + remote).
Used as a Jooble replacement when Jooble API key is missing.
"""

import asyncio
import logging

from app.services.scraper.base_scraper import HttpScraper, ScrapedJob

logger = logging.getLogger(__name__)

ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"


class ArbeitnowScraper(HttpScraper):
    platform = "arbeitnow"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])

        # Use target roles as primary search terms so Arbeitnow finds relevant PT/BR jobs
        search_terms = target_roles[:3] if target_roles else keywords[:3] or ["desenvolvedor"]

        # Build relevance filter: accept job if title/desc contains any role or keyword
        role_kw_lower = [r.lower() for r in (target_roles + keywords)]

        def _is_relevant(title: str, description: str) -> bool:
            """Pre-filter: accept only if any target role/keyword appears in title or description."""
            t = title.lower()
            d = description.lower()
            return any(rk in t or rk in d for rk in role_kw_lower)

        for term in search_terms:
            try:
                page = 1
                while page <= 3:
                    params = {
                        "search": term,
                        "page": page,
                    }
                    resp = await self.get_with_retry(ARBEITNOW_API_URL, params=params)
                    data = resp.json()

                    results = data.get("data", []) or data.get("jobs", [])
                    if not results:
                        break

                    for item in results:
                        title = item.get("title", "")
                        company = item.get("company_name", "")
                        if not title or not company:
                            continue
                        description = item.get("description", "")
                        # Pre-filter: skip obviously irrelevant jobs (EU/tech not matching our profile)
                        if role_kw_lower and not _is_relevant(title, description):
                            continue
                        tags = item.get("tags", []) or []
                        jobs.append(
                            ScrapedJob(
                                title=title,
                                company=company,
                                location=item.get("location", "") or "Remote",
                                description=description,
                                url=item.get("url", ""),
                                platform="arbeitnow",
                                salary_range=None,
                                requirements=tags if isinstance(tags, list) else [],
                            )
                        )

                    meta = data.get("meta", {})
                    total_count = int(meta.get("total", 0)) if isinstance(meta, dict) else 0
                    if total_count and page * 20 >= total_count:
                        break
                    if len(results) < 20:
                        break
                    page += 1

                    await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"Arbeitnow scrape error for '{term}': {e}")

        logger.info(f"Arbeitnow: found {len(jobs)} jobs")
        return jobs
