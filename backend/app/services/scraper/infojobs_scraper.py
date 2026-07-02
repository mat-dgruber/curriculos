"""InfoJobs scraper (Scrapling)."""

import asyncio
import logging
import random
import re
import urllib.parse

from app.services.scraper.base_scraper import ScraplingScraper, ScrapedJob

logger = logging.getLogger(__name__)

INFOJOBS_BASE_URL = "https://www.infojobs.com.br"


class InfoJobsScraper(ScraplingScraper):
    """Scraper for InfoJobs.com.br using Scrapling."""

    platform = "infojobs"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])
        location = search_params.get("location_str", "")

        search_terms = target_roles[:2] if target_roles else keywords[:2] or ["desenvolvedor"]

        async def scroll_action(page):
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 800)")
                await asyncio.sleep(1)

        for term in search_terms:
            try:
                slug = term.lower().replace(" ", "-")
                url = f"{INFOJOBS_BASE_URL}/vagas-de-{slug}"

                response = await self._fetch(
                    url,
                    wait_selector='a[href*="/vaga-de-"], .elementOffer, .card, [class*="vaga"]',
                    wait_selector_state="attached",
                    page_action=scroll_action,
                    timeout=10000,
                )

                page_text = response.get_all_text()
                if any(x in page_text.lower() for x in ["captcha", "cloudflare", "blocked", "distil", "robo"]):
                    logger.warning(f"InfoJobs: potentially blocked by security for '{term}'")
                    continue

                # InfoJobs job card links
                links = []
                for sel in ['a[href*="/vaga-de-"]', 'a[href*="/vaga-"]', 'a.vaga-link']:
                    links = response.css(sel)
                    if links:
                        break

                logger.info(f"InfoJobs '{term}': found {len(links)} raw links")

                seen_urls: set[str] = set()
                for link in links[:30]:
                    try:
                        href = link.attrib.get("href") or ""
                        if not href or href in seen_urls:
                            continue
                        if not href.startswith("http"):
                            href = f"{INFOJOBS_BASE_URL}{href}"
                        seen_urls.add(href)

                        title = link.get_all_text().strip()
                        if not title or len(title) < 3:
                            continue

                        # Find closest card container
                        card = link
                        for _ in range(6):
                            if not card.parent:
                                break
                            card = card.parent
                            if any(cls in card.attrib.get("class", "").lower() for cls in ["card", "offer", "li", "article", "offer"]):
                                break

                        company = ""
                        for sel in ['a[href*="/empresa-"]', 'div.company', '.nome-empresa', 'span.company']:
                            company_el = card.css(sel)
                            if company_el:
                                company = company_el.get_all_text().strip()
                                if company:
                                    break

                        loc = ""
                        all_text = card.get_all_text()
                        loc_match = re.search(
                            r'([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*\s*-\s*[A-Z]{2})',
                            all_text,
                        )
                        if loc_match:
                            loc = loc_match.group(1).strip()

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

                await asyncio.sleep(random.uniform(2, 4))

            except Exception as e:
                logger.warning(f"InfoJobs scrape error for '{term}': {e}")
                continue

        # Enrichment
        await self._enrich_descriptions(jobs)

        logger.info(f"InfoJobs: found {len(jobs)} jobs")
        return jobs

    async def _enrich_descriptions(self, jobs: list[ScrapedJob]):
        """Navega na página de detalhe de cada vaga para extrair a descrição."""
        enriched = 0
        for job in jobs[:15]:
            try:
                response = await self._fetch(job.url, timeout=20000)
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
                logger.debug(f"InfoJobs enrich failed for {job.url}: {e}")

        logger.info(f"InfoJobs: enriched {enriched}/{len(jobs)} descriptions")
