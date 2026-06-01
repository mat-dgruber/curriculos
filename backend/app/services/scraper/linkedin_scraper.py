import logging
import asyncio
from bs4 import BeautifulSoup

from app.services.scraper.base_scraper import BaseScraper, ScrapedJob

logger = logging.getLogger(__name__)

LINKEDIN_SEARCH_URL = "https://www.linkedin.com/jobs/search/"


class LinkedInScraper(BaseScraper):
    """Scraper for LinkedIn public job listings (no login required)."""

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "Brasil")

        search_terms = keywords[:2] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                url = (
                    f"{LINKEDIN_SEARCH_URL}"
                    f"?keywords={term}"
                    f"&location={location}"
                    f"&f_TPR=r604800"
                    f"&sortBy=DD"
                )

                await self._safe_goto(url)
                await self._random_delay(2, 4)

                await self._scroll_page()
                await self._random_delay(1, 2)

                cards = await self.page.query_selector_all(".job-search-card")

                for card in cards[:20]:
                    try:
                        title_el = await card.query_selector(".base-search-card__title")
                        company_el = await card.query_selector(".base-search-card__subtitle")
                        location_el = await card.query_selector(".job-search-card__location")
                        link_el = await card.query_selector("a.base-card__full-link")

                        title = (await title_el.inner_text()).strip() if title_el else ""
                        company = (await company_el.inner_text()).strip() if company_el else ""
                        loc = (await location_el.inner_text()).strip() if location_el else ""
                        url_val = (await link_el.get_attribute("href")) if link_el else ""

                        if title and company:
                            jobs.append(ScrapedJob(
                                title=title,
                                company=company,
                                location=loc,
                                description="",
                                url=url_val or url,
                                platform="linkedin",
                            ))
                    except Exception as e:
                        logger.debug(f"Error parsing LinkedIn card: {e}")
                        continue

                await self._random_delay(2, 4)

            except Exception as e:
                logger.warning(f"LinkedIn scrape error for '{term}': {e}")
                continue

        logger.info(f"LinkedIn: found {len(jobs)} jobs")
        return jobs

    async def _scroll_page(self):
        """Scroll down to load more job cards."""
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(1)
