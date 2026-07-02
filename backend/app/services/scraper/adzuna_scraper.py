import logging
import asyncio

from app.services.scraper.base_scraper import HttpScraper, ScrapedJob

logger = logging.getLogger(__name__)

ADZUNA_API_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"


class AdzunaScraper(HttpScraper):
    """Scraper para Adzuna API (500 req/mes gratis)."""

    platform = "adzuna"

    def __init__(self, app_id: str = "", app_key: str = ""):
        super().__init__()
        self.app_id = app_id
        self.app_key = app_key
        self.country = "br"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])
        location = search_params.get("location_str", "")

        search_terms = (
            target_roles[:2] if target_roles else keywords[:2] or ["desenvolvedor"]
        )

        if not self.app_id or not self.app_key:
            self.logger.warning("Adzuna: app_id/app_key not configured, skipping")
            return jobs

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

                    resp = await self.get_with_retry(url, params=params)
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

            except Exception as e:
                logger.error(f"Adzuna scrape error for '{term}': {e}")

        logger.info(f"Adzuna: found {len(jobs)} jobs")
        return jobs
