import logging
import asyncio

from app.services.scraper.base_scraper import HttpScraper, ScrapedJob

logger = logging.getLogger(__name__)

JOOBLE_API_URL = "https://jooble.org/api/"


class JoobleScraper(HttpScraper):
    """Scraper para Jooble API (gratuito, ilimitado)."""

    platform = "jooble"

    def __init__(self, api_key: str = ""):
        super().__init__()
        self.api_key = api_key

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "Brasil")

        search_terms = keywords[:3] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                page = 1
                while page <= 3:
                    payload = {
                        "keywords": term,
                        "location": location,
                        "page": page,
                    }
                    headers = {}
                    if self.api_key:
                        headers["Authorization"] = f"Bearer {self.api_key}"

                    resp = await self._client.post(
                        JOOBLE_API_URL,
                        json=payload,
                        headers=headers,
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    results = data.get("jobs", [])
                    if not results:
                        break

                    for item in results:
                        salary = item.get("salary", "")
                        job = ScrapedJob(
                            title=item.get("title", ""),
                            company=item.get("company", ""),
                            location=item.get("location", ""),
                            description=item.get("snippet", ""),
                            url=item.get("url", ""),
                            platform="jooble",
                            salary_range=salary if salary else None,
                        )
                        if job.title and job.company:
                            jobs.append(job)

                    total_count = data.get("totalCount", 0)
                    if page * 20 >= total_count:
                        break
                    page += 1

                    await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"Jooble scrape error for '{term}': {e}")

        logger.info(f"Jooble: found {len(jobs)} jobs")
        return jobs
