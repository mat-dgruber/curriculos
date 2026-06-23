import logging
import asyncio
import re

from app.services.scraper.base_scraper import PlaywrightScraper, ScrapedJob

logger = logging.getLogger(__name__)

INFOJOBS_BASE_URL = "https://www.infojobs.com.br"


class InfoJobsScraper(PlaywrightScraper):
    """Scraper for InfoJobs.com.br (Playwright, no API)."""

    platform = "infojobs"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])
        location = search_params.get("location_str", "")

        search_terms = target_roles[:2] if target_roles else keywords[:2] or ["desenvolvedor"]

        for term in search_terms:
            try:
                slug = term.replace(" ", "+")
                url = f"{INFOJOBS_BASE_URL}/vagas-de-{slug}"
                if location:
                    url += f"?localizacao={location}"

                await self._safe_goto(url)
                await self._random_delay(2, 4)

                await self._scroll_page()
                await self._random_delay(1, 2)

                # InfoJobs usa links com /vaga-de-* nos cards
                links = await self.page.query_selector_all('a[href*="/vaga-de-"]')

                seen_urls: set[str] = set()
                for link in links[:30]:
                    try:
                        href = await link.get_attribute("href") or ""
                        if not href or href in seen_urls:
                            continue
                        if not href.startswith("http"):
                            href = f"{INFOJOBS_BASE_URL}{href}"
                        seen_urls.add(href)

                        title = (await link.inner_text()).strip()
                        if not title or len(title) < 3:
                            continue

                        # Tenta pegar empresa do card pai
                        company = ""
                        loc = ""
                        try:
                            card = await link.evaluate_handle(
                                "el => el.closest('[class*=\"card\"], [class*=\"offer\"], li, article') || el.parentElement"
                            )
                            if card:
                                company_el = await card.query_selector('a[href*="/empresa-"]')
                                if company_el:
                                    company = (await company_el.inner_text()).strip()

                                all_text = await card.inner_text()
                                loc_match = re.search(
                                    r'([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*\s*-\s*[A-Z]{2})',
                                    all_text,
                                )
                                if loc_match:
                                    loc = loc_match.group(1).strip()
                        except Exception:
                            pass

                        if title and company:
                            jobs.append(ScrapedJob(
                                title=title,
                                company=company,
                                location=loc,
                                description="",
                                url=href,
                                platform="infojobs",
                            ))
                    except Exception as e:
                        logger.debug(f"Error parsing InfoJobs card: {e}")
                        continue

                await self._random_delay(2, 4)

            except Exception as e:
                logger.warning(f"InfoJobs scrape error for '{term}': {e}")
                continue

        # Enrichment: busca descrição nas páginas de detalhe
        await self._enrich_descriptions(jobs)

        logger.info(f"InfoJobs: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navega na página de detalhe de cada vaga para extrair a descrição."""
        enriched = 0
        for job in jobs[:15]:
            try:
                await self._safe_goto(job.url, timeout=20000)
                await self._random_delay(2, 3)

                desc = ""

                # Seletores CSS diretos
                for sel in [
                    '[class*="description"]',
                    '[class*="descricao"]',
                    '[data-qa="description"]',
                    '.text-description',
                    '#jobDescription',
                    'article',
                    '.detail-body',
                ]:
                    el = await self.page.query_selector(sel)
                    if el:
                        desc = (await el.inner_text()).strip()
                        if desc and len(desc) > 20:
                            break

                # Fallback JS
                if not desc or len(desc) < 20:
                    desc = await self.page.evaluate("""() => {
                        const selectors = [
                            '[class*="description"]',
                            '[class*="descricao"]',
                            '[data-qa="description"]',
                            '#jobDescription',
                            'article',
                            '.detail-body',
                        ];
                        for (const sel of selectors) {
                            const el = document.querySelector(sel);
                            if (el && el.innerText.length > 50) {
                                return el.innerText.trim();
                            }
                        }
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
                logger.debug(f"InfoJobs enrich failed for {job.url}: {e}")

        logger.info(f"InfoJobs: enriched {enriched}/{len(jobs)} descriptions")

    async def _scroll_page(self):
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 800)")
            await asyncio.sleep(1)
