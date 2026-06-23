---
name: Gupy Portal Public Scraping via __NEXT_DATA__
description: portal.gupy.io is server-side Next.js — job data embeds in inline JSON inside `<script id="__NEXT_DATA__">`, beat the 404 on the old /api/job endpoint
type: reference
---

Gupy has no public REST API for job listings (the legacy `https://api.gupy.io/api/job` returns 404/401 for unauthenticated callers). However, the public search portal at `https://portal.gupy.io/job/<term>` is server-side rendered by Next.js, which embeds the full query cache in a hydration JSON.

**Scrapeable shape:**
```
GET https://portal.gupy.io/job/<url-encoded-term>
↓
HTML response contains:
<script id="__NEXT_DATA__" type="application/json">{...}</script>
```

**Path inside JSON:** `props.pageProps.dehydratedState.queries[*].state.data.jobList[]`

**Per-job record fields:**
- `id`, `name` (title)
- `company.name` (nested)
- `address.city` (location — may be "Remoto")
- `description` (HTML often)
- Detail URL convention: `https://portal.gupy.io/jobs/{id}`

**Why:** On 2026-06-23 user replaced broken `GupyScraper` with `GupyPortalScraper` (`app/services/scraper/gupy_portal_scraper.py`) after the legacy API path returned 404 in production. Pickle from the Next.js hydration was the only accessible surface.

**How to apply:** When Gupy's documented API fails, route through the portal. Use regex `<script id="__NEXT_DATA__" type="application/json">(.+?)</script>` with `re.DOTALL`. Walk the `dehydratedState.queries[*].state.data.jobList` path — keys may shift between deploys; fall back to a defensive log if path is empty. Don't bump to Playwright unless hydration markers disappear (they don't, currently).
