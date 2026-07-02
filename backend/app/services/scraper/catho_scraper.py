"""Catho scraper (Scrapling)."""

import asyncio
import logging
import random

from app.services.scraper.base_scraper import ScraplingScraper, ScrapedJob

logger = logging.getLogger(__name__)

CATHO_BASE_URL = "https://www.catho.com.br"


class CathoScraper(ScraplingScraper):
    """Scraper for Catho.com.br using Scrapling."""

    platform = "catho"

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
                url = f"{CATHO_BASE_URL}/vagas/{slug}"
                if location:
                    import urllib.parse

                    url += f"?localizacao={urllib.parse.quote(location)}"

                response = await self._fetch(
                    url,
                    wait_selector='[data-qa="card-vaga"], [class*="card"], [class*="vaga"], article',
                    wait_selector_state="attached",
                    page_action=scroll_action,
                    timeout=25000,
                )

                # Check for block
                page_text = response.get_all_text()
                if "Operação Inválida" in page_text or len(page_text) < 500:
                    logger.warning("Catho: page blocked or empty, skipping")
                    break

                # Extract job cards
                cards = response.css(
                    '[data-qa="card-vaga"], [class*="card"], [class*="vaga"], article'
                )
                if not cards:
                    cards = response.css('a[href*="/vagas/"]')

                for card in cards[:20]:
                    try:
                        title = ""
                        for sel in [
                            '[data-qa="cargo"]',
                            "h2",
                            "h3",
                            '[class*="title"]',
                        ]:
                            title_el = card.css(sel)
                            if title_el:
                                title = title_el.get_all_text().strip()
                                if title:
                                    break

                        company = ""
                        for sel in [
                            '[data-qa="empresa"]',
                            '[class*="company"]',
                            '[class*="empresa"]',
                        ]:
                            company_el = card.css(sel)
                            if company_el:
                                company = company_el.get_all_text().strip()
                                if company:
                                    break

                        loc = ""
                        for sel in [
                            '[data-qa="localizacao"]',
                            '[class*="location"]',
                            '[class*="localizacao"]',
                        ]:
                            loc_el = card.css(sel)
                            if loc_el:
                                loc = loc_el.get_all_text().strip()
                                if loc:
                                    break

                        href = ""
                        link_el = card.css("a[href]")
                        if link_el:
                            href = link_el.attrib.get("href") or ""
                        if href and not href.startswith("http"):
                            href = f"{CATHO_BASE_URL}{href}"

                        if title and company:
                            jobs.append(
                                ScrapedJob(
                                    title=title,
                                    company=company,
                                    location=loc,
                                    description="",
                                    url=href or url,
                                    platform="catho",
                                )
                            )
                    except Exception as e:
                        logger.debug(f"Error parsing Catho card: {e}")
                        continue

                await asyncio.sleep(random.uniform(2, 4))

            except Exception as e:
                logger.warning(f"Catho scrape error for '{term}': {e}")
                continue

        # Enrichment
        await self._enrich_descriptions(jobs)

        logger.info(f"Catho: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navigate to job details and enrich descriptions."""
        enriched = 0
        for job in jobs[:15]:
            try:
                response = await self._fetch(job.url, timeout=20000)
                desc_el = response.css(
                    '[class*="description"], [class*="descricao"], [data-qa="description"], .job-description'
                )
                if desc_el:
                    desc = desc_el.get_all_text().strip()
                    if desc:
                        job.description = desc[:1000]
                        enriched += 1

                await asyncio.sleep(random.uniform(1, 2))
            except Exception as e:
                logger.debug(f"Catho enrich failed for {job.url}: {e}")

        logger.info(f"Catho: enriched {enriched}/{len(jobs)} descriptions")
