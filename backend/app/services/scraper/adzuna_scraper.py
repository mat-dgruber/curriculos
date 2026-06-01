import logging
import asyncio

import httpx

from app.services.scraper.base_scraper import ScrapedJob

logger = logging.getLogger(__name__)

ADZUNA_API_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"


class AdzunaScraper:
    """Scraper para Adzuna API (500 req/mês grátis). Não requer Playwright."""

    def __init__(self, app_id: str = "", app_key: str = ""):
        self.app_id = app_id
        self.app_key = app_key
        self.country = "br"
        self.logger = logging.getLogger(self.__class__.__name__)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "")

        search_terms = keywords[:3] if keywords else ["desenvolvedor"]

        if not self.app_id or not self.app_key:
            self.logger.warning("Adzuna: app_id/app_key not configured, skipping")
            return jobs

        async with httpx.AsyncClient(timeout=30.0) as client:
            for term in search_terms:
                try:
                    page = 1
                    while page <= 3:
                        url = ADZUNA_API_URL.format(country=self.country, page=page)
                        params = {
                            "app_id": self.app_id,
                            "app_key": self.app_key,
                            "what": term,
                            "results_per_page": 20,
                            "max_days_old": 7,
                            "sort_by": "date",
                        }
                        if location:
                            params["where"] = location

                        resp = await client.get(url, params=params)
                        resp.raise_for_status()
                        data = resp.json()

                        results = data.get("results", [])
                        if not results:
                            break

                        for item in results:
                            salary_min = item.get("salary_min")
                            salary_max = item.get("salary_max")
                            salary = None
                            if salary_min and salary_max:
                                salary = f"R${salary_min:,.0f} - R${salary_max:,.0f}"
                            elif salary_min:
                                salary = f"A partir de R${salary_min:,.0f}"

                            company = item.get("company", {})
                            location_data = item.get("location", {})

                            job = ScrapedJob(
                                title=item.get("title", ""),
                                company=company.get("display_name", ""),
                                location=location_data.get("display_name", ""),
                                description=item.get("description", ""),
                                url=item.get("redirect_url", ""),
                                platform="adzuna",
                                salary_range=salary,
                            )
                            if job.title and job.company:
                                jobs.append(job)

                        if len(results) < 20:
                            break
                        page += 1

                        await asyncio.sleep(2)

                except httpx.HTTPStatusError as e:
                    self.logger.warning(f"Adzuna API error for '{term}': {e.response.status_code}")
                except Exception as e:
                    self.logger.error(f"Adzuna scrape error for '{term}': {e}")

        self.logger.info(f"Adzuna: found {len(jobs)} jobs")
        return jobs
