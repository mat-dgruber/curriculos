import logging
import asyncio

import httpx

from app.services.scraper.base_scraper import ScrapedJob

logger = logging.getLogger(__name__)

JOOBLE_API_URL = "https://jooble.org/api/"


class JoobleScraper:
    """Scraper para Jooble API (gratuito, ilimitado). Não requer Playwright."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.logger = logging.getLogger(self.__class__.__name__)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "Brasil")

        search_terms = keywords[:3] if keywords else ["desenvolvedor"]

        async with httpx.AsyncClient(timeout=30.0) as client:
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

                        resp = await client.post(
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

                except httpx.HTTPStatusError as e:
                    self.logger.warning(f"Jooble API error for '{term}': {e.response.status_code}")
                except Exception as e:
                    self.logger.error(f"Jooble scrape error for '{term}': {e}")

        self.logger.info(f"Jooble: found {len(jobs)} jobs")
        return jobs
