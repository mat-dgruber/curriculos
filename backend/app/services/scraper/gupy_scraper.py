import logging
import asyncio

from app.services.scraper.base_scraper import HttpScraper, ScrapedJob

logger = logging.getLogger(__name__)

GUPY_API_URL = "https://api.gupy.io/api/job"


class GupyScraper(HttpScraper):
    """Scraper for Gupy jobs using their public JSON API."""

    platform = "gupy"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "")

        search_terms = keywords[:3] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                page = 1
                while page <= 3:
                    params = {
                        "search": term,
                        "page": page,
                        "limit": 20,
                    }
                    if location:
                        params["address"] = location

                    resp = await self._client.get(GUPY_API_URL, params=params)
                    resp.raise_for_status()
                    data = resp.json()

                    results = data.get("data", [])
                    if not results:
                        break

                    for item in results:
                        job = ScrapedJob(
                            title=item.get("name", ""),
                            company=item.get("company", {}).get("name", ""),
                            location=item.get("address", {}).get("city", ""),
                            description=item.get("description", ""),
                            url=f"https://gupy.io/jobs/{item.get('id', '')}",
                            platform="gupy",
                            salary_range=item.get("salaryRange"),
                        )
                        if job.title and job.company:
                            jobs.append(job)

                    if len(results) < 20:
                        break
                    page += 1

                    await asyncio.sleep(3)

            except Exception as e:
                logger.error(f"Gupy scrape error for '{term}': {e}")

        logger.info(f"Gupy: found {len(jobs)} jobs")
        return jobs
