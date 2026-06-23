import logging
import asyncio
from bs4 import BeautifulSoup

from app.services.scraper.base_scraper import PlaywrightScraper, ScrapedJob

logger = logging.getLogger(__name__)

VAGAS_URL = "https://www.vagas.com.br/vagas-de"


class VagasScraper(PlaywrightScraper):
    """Scraper for Vagas.com.br job listings."""

    platform = "vagas"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])
        location = search_params.get("location_str", "")

        search_terms = target_roles[:2] if target_roles else keywords[:2] or ["desenvolvedor"]

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

        # Enrichment: busca descrição nas páginas de detalhe
        await self._enrich_descriptions(jobs)

        logger.info(f"Vagas.com: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navega na página de detalhe de cada vaga para extrair a descrição."""
        enriched = 0
        for job in jobs[:15]:
            try:
                await self._safe_goto(job.url, timeout=20000)
                await self._random_delay(1, 2)

                desc_el = await self.page.query_selector(
                    ".job-description, .descricao-vaga, [class*='description'], [class*='descricao']"
                )
                if desc_el:
                    desc = (await desc_el.inner_text()).strip()
                    if desc:
                        job.description = desc[:1000]
                        enriched += 1

                await self._random_delay(1, 2)
            except Exception as e:
                logger.debug(f"Vagas.com enrich failed for {job.url}: {e}")

        logger.info(f"Vagas.com: enriched {enriched}/{len(jobs)} descriptions")

    async def _scroll_page(self):
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(1)
