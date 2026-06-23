"""Gupy portal scraper (Playwright).

Fallback strategy: when the public JSON API is unavailable (404/401),
scrape via the public search portal at https://portal.gupy.io/. The portal
renders server-side HTML (Next.js) with hydration markers, so we extract
job data from the inline JSON present in the HTML response.
"""

import asyncio
import json
import logging
import re

from app.services.scraper.base_scraper import HttpScraper, ScrapedJob

logger = logging.getLogger(__name__)

GUPY_PORTAL_SEARCH = "https://portal.gupy.io/job-search/term={term}"


class GupyPortalScraper(HttpScraper):
    """Scrape Gupy jobs from the public portal page for a search term."""

    platform = "gupy_portal"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs: list[ScrapedJob] = []
        keywords = search_params.get("keywords", [])

        search_terms = keywords[:3] if keywords else ["desenvolvedor"]

        for term in search_terms:
            try:
                url = GUPY_PORTAL_SEARCH.format(term=term.replace(" ", "%20"))
                resp = await self._client.get(url, timeout=30.0)
                resp.raise_for_status()
                html = resp.text

                # Try to extract JSON embedded by Next.js hydration
                pattern = r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>'
                match = re.search(pattern, html, re.DOTALL)
                if not match:
                    logger.warning(f"Gupy portal: no __NEXT_DATA__ for '{term}'")
                    continue

                data = json.loads(match.group(1))
                # Jobs live under dehydratedState/queries[*].state.data.jobList
                items = self._extract_jobs(data)
                if not items:
                    logger.info(f"Gupy portal: empty result for '{term}'")
                    continue

                for item in items:
                    job_id = item.get("id") or item.get("jobId")
                    title = item.get("name") or item.get("title") or ""
                    company = (item.get("company") or {}).get("name") or ""
                    address = item.get("address") or {}
                    location = address.get("city") if isinstance(address, dict) else ""
                    description = item.get("description") or item.get("summary") or ""
                    slug = item.get("slug") or job_id

                    if not title or not company:
                        continue

                    jobs.append(
                        ScrapedJob(
                            title=title,
                            company=company,
                            location=location or "Brasil",
                            description=description,
                            url=f"https://portal.gupy.io/jobs/{job_id}" if job_id else f"https://portal.gupy.io/job/{slug}",
                            platform="gupy",
                            salary_range=item.get("salaryRange"),
                        )
                    )

                await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"Gupy portal scrape error for '{term}': {e}")

        logger.info(f"Gupy portal: found {len(jobs)} jobs")
        return jobs

    def _extract_jobs(self, data: dict) -> list[dict]:
        """Walk the Next.js dehydrated state looking for job arrays."""
        results: list[dict] = []

        def walk(node):
            if isinstance(node, dict):
                if "jobList" in node and isinstance(node["jobList"], list):
                    results.extend(node["jobList"])
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)

        try:
            queries = (
                data.get("props", {})
                .get("pageProps", {})
                .get("dehydratedState", {})
                .get("queries", [])
            )
            for q in queries:
                inner = q.get("state", {}).get("data", {})
                if isinstance(inner, dict):
                    walk(inner)
        except Exception:
            pass

        return results
