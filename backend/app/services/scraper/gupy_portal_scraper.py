"""Gupy portal scraper (Scrapling).

The Gupy portal (https://portal.gupy.io/) is a fully client-side React/Next.js app.
Job listings are fetched via XHR after page load — the initial __NEXT_DATA__ no longer
contains job data (dehydratedState.queries is empty). We use Scrapling's AsyncStealthySession
to fetch, wait, and parse job cards.
"""

import asyncio
import logging
import random

from app.services.scraper.base_scraper import ScraplingScraper, ScrapedJob

logger = logging.getLogger(__name__)

GUPY_PORTAL_SEARCH = "https://portal.gupy.io/job-search/term={term}"


class GupyPortalScraper(ScraplingScraper):
    """Scrape Gupy jobs from the public portal using Scrapling."""

    platform = "gupy_portal"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        target_roles = search_params.get("title", [])
        keywords = search_params.get("keywords", [])

        # Prefer target role names as search terms (e.g. "Assistente de RH")
        search_terms = (
            target_roles[:2] if target_roles else keywords[:2] or ["desenvolvedor"]
        )

        async def scroll_action(page):
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 600)")
                await asyncio.sleep(random.uniform(0.8, 1.5))

        for term in search_terms:
            try:
                url = GUPY_PORTAL_SEARCH.format(term=term.replace(" ", "%20"))

                response = await self._fetch(
                    url,
                    wait_selector="a[href*='/job/']",
                    wait_selector_state="attached",
                    page_action=scroll_action,
                    timeout=30000,
                )

                term_jobs = self._extract_jobs(response)
                jobs.extend(term_jobs)
                logger.info(f"Gupy portal: '{term}' -> {len(term_jobs)} jobs")

                await asyncio.sleep(random.uniform(2, 4))

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

    def _extract_jobs(self, response) -> list[ScrapedJob]:
        """Extract job data from Scrapling Response object."""
        jobs: list[ScrapedJob] = []

        # Strategy 1: anchor tags with /job/ in href
        job_links = response.css('a[href*="/job/"]', adaptive=True)
        for link in job_links:
            try:
                href = link.attrib.get("href")
                if not href:
                    continue
                if not href.startswith("http"):
                    href = f"https://portal.gupy.io{href}"

                # Skip nav/footer links that happen to contain "/job/"
                if any(
                    skip in href for skip in ["/job-search", "/jobs?", "javascript:"]
                ):
                    continue

                text = link.get_all_text().strip()
                lines = [line.strip() for line in text.split("\n") if line.strip()]

                # Check lines structure
                if not lines or len(lines) < 2:
                    continue

                # Gupy card text layout: Line 0 is typically Company Name, Line 1 is Job Title
                company = lines[0]
                title = lines[1] if len(lines) > 1 else lines[0]

                if (
                    "VENHA" in company.upper()
                    or "CARREIRA" in company.upper()
                    or "Badge" in company
                ):
                    # If line 0 is a promotional badge, shift down
                    if len(lines) >= 3:
                        company = lines[1]
                        title = lines[2]

                # Clean title and company
                title = title.strip()
                company = company.strip()

                # Location is usually line 2 or 3
                location = "Brasil"
                for line in lines[2:5]:
                    if any(
                        loc_indicator in line.lower()
                        for loc_indicator in [
                            "remote",
                            "remoto",
                            "híbrido",
                            "hybrid",
                            "on-site",
                            "presencial",
                            "são paulo",
                            "rio",
                            "mg",
                            "pr",
                            "rs",
                            "sc",
                            "df",
                            "es",
                        ]
                    ):
                        location = line.strip()
                        break

                if title and href:
                    jobs.append(
                        ScrapedJob(
                            title=title,
                            company=company or "Gupy",
                            location=location,
                            description="",
                            url=href,
                            platform="gupy",
                        )
                    )
            except Exception as e:
                logger.warning(f"Error parsing job link: {e}")
                continue

        return jobs
