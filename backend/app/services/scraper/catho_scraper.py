import logging
import asyncio

from app.services.scraper.base_scraper import PlaywrightScraper, ScrapedJob

logger = logging.getLogger(__name__)

CATHO_BASE_URL = "https://www.catho.com.br"


class CathoScraper(PlaywrightScraper):
    """Scraper for Catho.com.br (Playwright, no API).

    Catho tem proteção anti-bot. Seletores defensivos com fallbacks.
    """

    platform = "catho"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])
        location = search_params.get("location", "")

        search_terms = keywords[:2] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                slug = term.replace(" ", "+")
                url = f"{CATHO_BASE_URL}/vagas/{slug}"
                if location:
                    url += f"?localizacao={location}"

                await self._safe_goto(url)
                await self._random_delay(3, 5)

                page_text = await self.page.inner_text("body")
                if "Operação Inválida" in page_text or len(page_text) < 500:
                    logger.warning("Catho: page blocked or empty, skipping")
                    break

                await self._scroll_page()
                await self._random_delay(1, 2)

                cards = await self.page.query_selector_all(
                    '[data-qa="card-vaga"], [class*="card"], [class*="vaga"], article'
                )

                if not cards:
                    cards = await self.page.query_selector_all('a[href*="/vagas/"]')

                for card in cards[:20]:
                    try:
                        title = ""
                        for sel in ['[data-qa="cargo"]', 'h2', 'h3', '[class*="title"]']:
                            el = await card.query_selector(sel)
                            if el:
                                title = (await el.inner_text()).strip()
                                if title:
                                    break

                        company = ""
                        for sel in ['[data-qa="empresa"]', '[class*="company"]', '[class*="empresa"]']:
                            el = await card.query_selector(sel)
                            if el:
                                company = (await el.inner_text()).strip()
                                if company:
                                    break

                        loc = ""
                        for sel in ['[data-qa="localizacao"]', '[class*="location"]', '[class*="localizacao"]']:
                            el = await card.query_selector(sel)
                            if el:
                                loc = (await el.inner_text()).strip()
                                if loc:
                                    break

                        href = ""
                        link_el = await card.query_selector("a[href]")
                        if link_el:
                            href = await link_el.get_attribute("href") or ""
                        if href and not href.startswith("http"):
                            href = f"{CATHO_BASE_URL}{href}"

                        if title and company:
                            jobs.append(ScrapedJob(
                                title=title,
                                company=company,
                                location=loc,
                                description="",
                                url=href or url,
                                platform="catho",
                            ))
                    except Exception as e:
                        logger.debug(f"Error parsing Catho card: {e}")
                        continue

                await self._random_delay(2, 4)

            except Exception as e:
                logger.warning(f"Catho scrape error for '{term}': {e}")
                continue

        # Enrichment: busca descrição nas páginas de detalhe
        await self._enrich_descriptions(jobs)

        logger.info(f"Catho: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navega na página de detalhe de cada vaga para extrair a descrição."""
        enriched = 0
        for job in jobs[:15]:
            try:
                await self._safe_goto(job.url, timeout=20000)
                await self._random_delay(1, 2)

                desc_el = await self.page.query_selector(
                    '[class*="description"], [class*="descricao"], [data-qa="description"], .job-description'
                )
                if desc_el:
                    desc = (await desc_el.inner_text()).strip()
                    if desc:
                        job.description = desc[:1000]
                        enriched += 1

                await self._random_delay(1, 2)
            except Exception as e:
                logger.debug(f"Catho enrich failed for {job.url}: {e}")

        logger.info(f"Catho: enriched {enriched}/{len(jobs)} descriptions")

    async def _scroll_page(self):
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(1)
