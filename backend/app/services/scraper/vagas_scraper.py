import logging
import asyncio
from bs4 import BeautifulSoup

from app.services.scraper.base_scraper import BaseScraper, ScrapedJob

logger = logging.getLogger(__name__)

VAGAS_URL = "https://www.vagas.com.br/vagas-de"


class VagasScraper(BaseScraper):
    """Scraper for Vagas.com.br job listings."""

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "")

        search_terms = keywords[:2] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                slug = term.lower().replace(" ", "-").replace("+", "%2B")
                url = f"{VAGAS_URL}/{slug}"
                if location:
                    url += f"?localizacao={location}"

                await self._safe_goto(url)
                await self._random_delay(2, 4)

                await self._scroll_page()
                await self._random_delay(1, 2)

                content = await self.page.content()
                soup = BeautifulSoup(content, "lxml")

                cards = soup.select("li.vaga")

                for card in cards[:20]:
                    try:
                        title_el = card.select_one("h2.cargo a")
                        company_el = card.select_one("span.emprVaga")
                        location_el = card.select_one("span.vaga-local")

                        title = title_el.get_text(strip=True) if title_el else ""
                        company = company_el.get_text(strip=True) if company_el else ""
                        loc = location_el.get_text(strip=True) if location_el else ""
                        link = title_el.get("href", "") if title_el else ""

                        if link and not link.startswith("http"):
                            link = f"https://www.vagas.com.br{link}"

                        if title and company:
                            jobs.append(ScrapedJob(
                                title=title,
                                company=company,
                                location=loc,
                                description="",
                                url=link,
                                platform="vagas",
                            ))
                    except Exception as e:
                        logger.debug(f"Error parsing Vagas.com card: {e}")
                        continue

                await self._random_delay(2, 4)

            except Exception as e:
                logger.warning(f"Vagas.com scrape error for '{term}': {e}")
                continue

        logger.info(f"Vagas.com: found {len(jobs)} jobs")
        return jobs

    async def _scroll_page(self):
        """Scroll down to load more jobs."""
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(1)
