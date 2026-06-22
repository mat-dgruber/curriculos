import logging
import asyncio

from app.services.scraper.base_scraper import PlaywrightScraper, ScrapedJob

logger = logging.getLogger(__name__)

LINKEDIN_SEARCH_URL = "https://www.linkedin.com/jobs/search/"


class LinkedInScraper(PlaywrightScraper):
    """Scraper for LinkedIn public job listings (no login required)."""

    platform = "linkedin"

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

        # Enrichment: busca descrição nas páginas de detalhe
        await self._enrich_descriptions(jobs)

        logger.info(f"LinkedIn: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navega na página de detalhe de cada vaga para extrair a descrição."""
        enriched = 0
        for job in jobs[:5]:
            try:
                await self._safe_goto(job.url, timeout=20000)
                await self._random_delay(2, 3)

                # Tenta múltiplas abordagens para pegar a descrição
                desc = ""

                # 1. Seletores CSS diretos
                for sel in [
                    ".show-more-less-html__markup",
                    ".description__text",
                    ".show-more-less-html",
                    "[data-tracking-control-name='public_jobs.description']",
                    ".rich-text",
                ]:
                    el = await self.page.query_selector(sel)
                    if el:
                        desc = (await el.inner_text()).strip()
                        if desc and len(desc) > 20:
                            break

                # 2. Fallback: JavaScript para extrair texto de qualquer bloco grande
                if not desc or len(desc) < 20:
                    desc = await self.page.evaluate("""() => {
                        const selectors = [
                            '.show-more-less-html__markup',
                            '.description__text',
                            '.show-more-less-html',
                            '[data-tracking-control-name]',
                            '.rich-text',
                            '.description',
                            'article',
                        ];
                        for (const sel of selectors) {
                            const el = document.querySelector(sel);
                            if (el && el.innerText.length > 50) {
                                return el.innerText.trim();
                            }
                        }
                        // Fallback: maior bloco de texto na página
                        const all = document.querySelectorAll('p, li, div');
                        let best = '';
                        for (const el of all) {
                            const t = el.innerText.trim();
                            if (t.length > best.length && t.length < 5000) best = t;
                        }
                        return best;
                    }""")

                if desc and len(desc) > 20:
                    job.description = desc[:1000]
                    enriched += 1

                await self._random_delay(1, 2)
            except Exception as e:
                logger.debug(f"LinkedIn enrich failed for {job.url}: {e}")

        logger.info(f"LinkedIn: enriched {enriched}/{len(jobs)} descriptions")

    async def _scroll_page(self):
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(1)
