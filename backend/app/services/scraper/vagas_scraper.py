"""Vagas.com.br scraper (Scrapling)."""

import asyncio
import logging
import random
import urllib.parse

from app.services.scraper.base_scraper import ScraplingScraper, ScrapedJob

logger = logging.getLogger(__name__)

VAGAS_SEARCH_URL = "https://www.vagas.com.br/vagas"


class VagasScraper(ScraplingScraper):
    """Scraper for Vagas.com.br job listings using Scrapling."""

    platform = "vagas"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])
        location = search_params.get("location_str", "")

        search_terms = (
            target_roles[:2] if target_roles else keywords[:2] or ["desenvolvedor"]
        )

        async def scroll_action(page):
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 800)")
                await asyncio.sleep(1)

        for term in search_terms:
            try:
                slug = term.lower().replace(" ", "-")
                url = f"https://www.vagas.com.br/vagas-de-{slug}"

                response = await self._fetch(
                    url,
                    wait_selector="li.vaga, .vaga, article, [class*='vaga']",
                    wait_selector_state="attached",
                    page_action=scroll_action,
                    timeout=10000,
                )

                page_text = response.get_all_text()
                if any(x in page_text.lower() for x in ["captcha", "cloudflare", "blocked", "distil"]):
                    logger.warning(f"Vagas.com: potentially blocked by security for '{term}'")
                    continue

                cards = []
                for sel in ["li.vaga", ".vaga", "article", "[class*='vaga']"]:
                    cards = response.css(sel)
                    if cards:
                        break

                logger.info(f"Vagas.com '{term}': found {len(cards)} raw cards")

                for card in cards[:20]:
                    try:
                        title = ""
                        link = ""
                        for sel in ["h2.cargo a", "h3 a", "a.vaga-link", "h2 a", "a"]:
                            title_el = card.css(sel)
                            if title_el:
                                title = title_el.get_all_text().strip()
                                link = title_el.attrib.get("href", "")
                                if title:
                                    break

                        company = ""
                        for sel in ["span.emprVaga", ".empresa", ".emprVaga", "span.nome-empresa"]:
                            company_el = card.css(sel)
                            if company_el:
                                company = company_el.get_all_text().strip()
                                if company:
                                    break

                        loc = ""
                        for sel in ["span.vaga-local", ".local", ".vaga-local", "span.localizacao"]:
                            location_el = card.css(sel)
                            if location_el:
                                loc = location_el.get_all_text().strip()
                                if loc:
                                    break

                        if link and not link.startswith("http"):
                            link = f"https://www.vagas.com.br{link}"

                        if title and company:
                            jobs.append(
                                ScrapedJob(
                                    title=title,
                                    company=company,
                                    location=loc,
                                    description="",
                                    url=link,
                                    platform="vagas",
                                )
                            )
                    except Exception as e:
                        logger.debug(f"Error parsing Vagas.com card: {e}")
                        continue

                await asyncio.sleep(random.uniform(2, 4))

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
                response = await self._fetch(job.url, timeout=20000)
                desc_el = response.css(
                    ".job-description, .descricao-vaga, [class*='description'], [class*='descricao']"
                )
                if desc_el:
                    desc = desc_el.get_all_text().strip()
                    if desc:
                        job.description = desc[:1000]
                        enriched += 1

                await asyncio.sleep(random.uniform(1, 2))
            except Exception as e:
                logger.debug(f"Vagas.com enrich failed for {job.url}: {e}")

        logger.info(f"Vagas.com: enriched {enriched}/{len(jobs)} descriptions")
