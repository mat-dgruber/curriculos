"""LinkedIn public scraper (Scrapling)."""

import asyncio
import logging
import random
import urllib.parse

from app.services.scraper.base_scraper import ScraplingScraper, ScrapedJob

logger = logging.getLogger(__name__)

LINKEDIN_SEARCH_URL = "https://www.linkedin.com/jobs/search/"


class LinkedInScraper(ScraplingScraper):
    """Scraper for LinkedIn public job listings using Scrapling."""

    platform = "linkedin"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])
        location = search_params.get("location_str", "Brasil")

        search_terms = (
            target_roles[:3] if target_roles else keywords[:2] or ["desenvolvedor"]
        )

        async def scroll_action(page):
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 800)")
                await asyncio.sleep(1)

        for term in search_terms:
            try:
                url = (
                    f"{LINKEDIN_SEARCH_URL}"
                    f"?keywords={urllib.parse.quote(term)}"
                    f"&location={urllib.parse.quote(location)}"
                    f"&f_TPR=r604800"
                    f"&sortBy=DD"
                )

                # Wait for any of the common card selectors
                response = await self._fetch(
                    url,
                    wait_selector=".job-search-card, .base-card, [data-entity-urn]",
                    wait_selector_state="attached",
                    page_action=scroll_action,
                    timeout=10000,
                )

                # Try different card selectors as fallback
                cards = []
                for sel in [".job-search-card", ".base-card", "div.base-card", "li[data-entity-urn]"]:
                    cards = response.css(sel)
                    if cards:
                        break

                logger.info(f"LinkedIn '{term}': found {len(cards)} raw cards")

                for card in cards[:20]:
                    try:
                        title = ""
                        for sel in [".base-search-card__title", "h3", "h4", ".title"]:
                            title_el = card.css(sel)
                            if title_el:
                                title = title_el.get_all_text().strip()
                                if title:
                                    break

                        company = ""
                        for sel in [".base-search-card__subtitle", "h4", ".company", "a.hidden-nested-link"]:
                            company_el = card.css(sel)
                            if company_el:
                                company = company_el.get_all_text().strip()
                                if company:
                                    break

                        loc = ""
                        for sel in [".job-search-card__location", ".location", "span.job-search-card__location"]:
                            loc_el = card.css(sel)
                            if loc_el:
                                loc = loc_el.get_all_text().strip()
                                if loc:
                                    break

                        url_val = ""
                        for sel in ["a.base-card__full-link", "a[href*='/jobs/view/']", "a"]:
                            link_el = card.css(sel)
                            if link_el:
                                url_val = link_el.attrib.get("href") or ""
                                if url_val:
                                    break

                        if title and company:
                            jobs.append(
                                ScrapedJob(
                                    title=title,
                                    company=company,
                                    location=loc,
                                    description="",
                                    url=url_val or url,
                                    platform="linkedin",
                                )
                            )
                    except Exception as e:
                        logger.debug(f"Error parsing LinkedIn card: {e}")
                        continue

                await asyncio.sleep(random.uniform(2, 4))

            except Exception as e:
                logger.warning(f"LinkedIn scrape error for '{term}': {e}")
                continue

        # Enrichment
        await self._enrich_descriptions(jobs)

        logger.info(f"LinkedIn: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navega na página de detalhe de cada vaga para extrair a descrição."""
        enriched = 0
        for job in jobs[:5]:
            try:
                response = await self._fetch(job.url, timeout=20000)
                desc = ""

                # Seletores CSS diretos
                for sel in [
                    ".show-more-less-html__markup",
                    ".description__text",
                    ".show-more-less-html",
                    "[data-tracking-control-name='public_jobs.description']",
                    ".rich-text",
                    ".description",
                    "article",
                ]:
                    desc_el = response.css(sel)
                    if desc_el:
                        desc = desc_el.get_all_text().strip()
                        if desc and len(desc) > 20:
                            break

                # Fallback to get any text block
                if not desc or len(desc) < 20:
                    for tag in ["p", "div", "article"]:
                        elements = response.css(tag)
                        best = ""
                        for el in elements:
                            t = el.get_all_text().strip()
                            if len(t) > len(best) and len(t) < 5000:
                                best = t
                        if len(best) > 50:
                            desc = best
                            break

                if desc and len(desc) > 20:
                    job.description = desc[:1000]
                    enriched += 1

                await asyncio.sleep(random.uniform(1, 2))
            except Exception as e:
                logger.debug(f"LinkedIn enrich failed for {job.url}: {e}")

        logger.info(f"LinkedIn: enriched {enriched}/{len(jobs)} descriptions")
