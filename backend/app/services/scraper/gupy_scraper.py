import logging
import httpx

from app.services.scraper.base_scraper import BaseScraper, ScrapedJob

logger = logging.getLogger(__name__)

GUPY_API_URL = "https://api.gupy.io/api/job"


class GupyScraper(BaseScraper):
    """Scraper for Gupy jobs using their public JSON API."""

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "")

        search_terms = keywords[:3] if keywords else ["desenvolvedor"]

        async with httpx.AsyncClient(timeout=30.0) as client:
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

                        resp = await client.get(GUPY_API_URL, params=params)
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

                        import asyncio
                        await asyncio.sleep(3)

                except httpx.HTTPStatusError as e:
                    logger.warning(f"Gupy API error for '{term}': {e.response.status_code}")
                except Exception as e:
                    logger.error(f"Gupy scrape error for '{term}': {e}")

        logger.info(f"Gupy: found {len(jobs)} jobs")
        return jobs
