"""Gupy portal scraper (Playwright).

The Gupy portal (https://portal.gupy.io/) is a fully client-side React/Next.js app.
Job listings are fetched via XHR after page load — the initial __NEXT_DATA__ no longer
contains job data (dehydratedState.queries is empty). We use Playwright to let the JS
execute and wait for job cards to appear in the DOM.
"""

import asyncio
import logging

from app.services.scraper.base_scraper import PlaywrightScraper, ScrapedJob

logger = logging.getLogger(__name__)

GUPY_PORTAL_SEARCH = "https://portal.gupy.io/job-search/term={term}"

# Job card selectors – Gupy uses styled-components with generated class names,
# so we target structural/data attributes that are stable.
JOB_CARD_SELECTOR = "[data-testid='job-card'], [class*='JobCard'], a[href*='/job/']"
TITLE_SELECTOR = "[data-testid='job-card-title'], [class*='JobTitle'], h2, h3"
COMPANY_SELECTOR = "[data-testid='job-card-company'], [class*='CompanyName'], [class*='company']"
LOCATION_SELECTOR = "[data-testid='job-card-location'], [class*='Location'], [class*='location']"


class GupyPortalScraper(PlaywrightScraper):
    """Scrape Gupy jobs from the public portal using Playwright (JS-rendered SPA)."""

    platform = "gupy_portal"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])

        search_terms = keywords[:2] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                url = GUPY_PORTAL_SEARCH.format(term=term.replace(" ", "%20"))
                await self._safe_goto(url, timeout=30000)

                # Wait for job cards to load (XHR-driven content)
                await self._wait_for_jobs()

                # Extract job cards via JS evaluation
                term_jobs = await self._extract_jobs_from_page(url)
                jobs.extend(term_jobs)
                logger.info(f"Gupy portal: '{term}' -> {len(term_jobs)} jobs")

                await self._random_delay(2, 4)

            except Exception as e:
                logger.warning(f"Gupy portal scrape error for '{term}': {e}")
                continue

        # Deduplicate by URL
        seen_urls: set[str] = set()
        unique_jobs = []
        for j in jobs:
            if j.url not in seen_urls:
                seen_urls.add(j.url)
                unique_jobs.append(j)

        logger.info(f"Gupy portal: found {len(unique_jobs)} unique jobs total")
        return unique_jobs

    async def _wait_for_jobs(self):
        """Wait for the job list to appear on the page."""
        try:
            # Wait up to 15s for any job content to load
            await self.page.wait_for_selector(
                "a[href*='/job/'], [data-testid*='job'], [class*='job-card'], [class*='JobCard'], "
                "[class*='VacancyCard'], [class*='vacancy']",
                timeout=15000,
                state="attached",
            )
        except Exception:
            # Fallback: just wait a bit for XHR to complete
            await asyncio.sleep(4)

        # Scroll to trigger lazy loading
        for _ in range(3):
            await self.page.evaluate("window.scrollBy(0, 600)")
            await asyncio.sleep(1)

    async def _extract_jobs_from_page(self, page_url: str) -> list[ScrapedJob]:
        """Extract job data from the rendered DOM."""
        jobs: list[ScrapedJob] = []

        try:
            # Try structured extraction via JS
            raw = await self.page.evaluate("""() => {
                const results = [];

                // Strategy 1: anchor tags with /job/ in href
                const jobLinks = document.querySelectorAll('a[href*="/job/"]');
                jobLinks.forEach(link => {
                    const href = link.href || '';
                    if (!href || results.some(r => r.url === href)) return;

                    // Walk up to find the card container
                    let card = link;
                    for (let i = 0; i < 6; i++) {
                        if (!card.parentElement) break;
                        card = card.parentElement;
                        const text = card.innerText || '';
                        if (text.length > 20) break;
                    }

                    const cardText = (card && card.innerText) ? card.innerText.trim() : link.innerText.trim();
                    const lines = cardText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);

                    const title = lines[0] || link.innerText.trim();
                    const company = lines[1] || '';
                    const location = lines[2] || '';

                    if (title && title.length > 2) {
                        results.push({ title, company, location, url: href });
                    }
                });

                // Strategy 2: any element with job-like data attributes
                const dataEls = document.querySelectorAll('[data-job-id], [data-id][data-title]');
                dataEls.forEach(el => {
                    const title = el.getAttribute('data-title') || '';
                    const company = el.getAttribute('data-company') || '';
                    const url = el.getAttribute('data-url') || el.querySelector('a')?.href || '';
                    if (title && url && !results.some(r => r.url === url)) {
                        results.push({ title, company, location: '', url });
                    }
                });

                return results.slice(0, 25);
            }""")

            for item in (raw or []):
                title = (item.get("title") or "").strip()
                company = (item.get("company") or "").strip()
                location = (item.get("location") or "").strip()
                url = (item.get("url") or "").strip()

                if not title or not url:
                    continue

                # Skip nav/footer links that happen to contain "/job/"
                if any(skip in url for skip in ["/job-search", "/jobs?", "javascript:"]):
                    continue

                jobs.append(ScrapedJob(
                    title=title,
                    company=company or "Gupy",
                    location=location or "Brasil",
                    description="",
                    url=url,
                    platform="gupy",
                ))

        except Exception as e:
            logger.warning(f"Gupy portal JS extraction failed: {e}")

        return jobs
