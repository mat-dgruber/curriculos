---
name: Scraper Orchestrator — Implemented
description: Fase 3 completa — orquestrador HttpScraper/PlaywrightScraper com 8 platforms, asyncio.gather, error isolation, rate limiting
type: project
---

Scraper orchestrator fully implemented and all 8 scrapers integrated (2026-06-01). 107 backend tests passing.

**Architecture:**
```
ScraperProtocol (typing.Protocol)
├── HttpScraper (ABC) ──── httpx, no Playwright overhead
│   ├── GupyScraper, JoobleScraper, AdzunaScraper, RemotiveScraper
└── PlaywrightScraper (ABC) ──── browser + helpers
    ├── LinkedInScraper, VagasScraper, InfoJobsScraper, CathoScraper
```
- `ScraperOrchestrator` at `backend/app/services/scraper/orchestrator.py`: `asyncio.gather` concurrency, per-platform error isolation, `ScraperResult`/`OrchestratorResult` dataclasses
- Config: `enabled_scrapers` in Settings (comma-separated, empty = all platforms)
- `scan_service.py` refactored to use orchestrator instead of sequential loop
- `BaseScraper` alias kept for backward compatibility

**Rate Limiter** (`backend/app/services/scraper/rate_limiter.py`):
- Persists state to `storage/scraper_rate_state.json` between process restarts
- Adzuna: max 1 run/day (free tier is 500 req/month — 3 keywords × 3 pages = 24 req/scan would blow the limit)
- Remotive: max 4 req/day (API hard limit)
- All others: unlimited
- `can_run(platform)` checked before each scraper, `record_run(platform)` after success

**8 Platforms:**

| Platform | Type | Auth | Rate Limit | Status |
|----------|------|------|------------|--------|
| Gupy | HttpScraper | None | Unlimited | Refactored from PlaywrightScraper |
| Jooble | HttpScraper | API key | Unlimited | Refactored from standalone |
| Adzuna | HttpScraper | app_id+key | 1/day | Refactored from standalone |
| Remotive | HttpScraper | None | 4/day | NEW — remote only |
| LinkedIn | PlaywrightScraper | N/A | Unlimited | Refactored, bs4 import removed |
| Vagas.com | PlaywrightScraper | N/A | Unlimited | Refactored |
| InfoJobs | PlaywrightScraper | N/A | Unlimited | NEW — `a[href*="/vaga-de-"]` selector |
| Catho | PlaywrightScraper | N/A | Unlimited | NEW — anti-bot blocks automated access |

**InfoJobs selectors:** `a[href*="/vaga-de-"]` for card links, company via `a[href*="/empresa-"]`, location via regex `([A-ZÀ-Ú][a-zà-ú]+(\s[A-ZÀ-Ú][a-zà-ú]+)*\s*-\s*[A-Z]{2})`.

**Catho selectors:** Defensive fallback chain (`[data-qa]`, `[class*]`, `h2/h3`). Catho returns "Operação Inválida" for automated requests — page_text check added, scraper skips gracefully. Selectors won't match real content but won't crash.

**Updated downstream:**
- `platform-class.pipe.ts`: 8 platform colors (linkedin=primary, gupy=accent, vagas=warning, jooble=success, adzuna=info, remotive=purple, infojobs=orange, catho=rose)
- `jobs-list.component.ts`: dropdown with 9 options (all + 8 platforms)
- `notification_service.py`: dynamically lists all platforms (was hardcoded to 3)
- `matcher.py`: trusted bonus for linkedin, gupy, infojobs, catho
- `roadmap.md`: Fase 3 marked [COMPLETO]

**Description Enrichment (2026-06-01):**
- All 4 Playwright scrapers have `_enrich_descriptions()` method: navigates to detail page (max 15 per search) to extract full description
- Standalone `enrichment_service.py` + `POST /jobs/enrich` endpoint for backfilling existing jobs
- Frontend: "Preencher descricoes" button in jobs-list triggers enrichment in background
- Each scraper has platform-specific selectors: LinkedIn `.show-more-less-html__markup`, Vagas `.job-description`, InfoJobs `[class*="description"]`, Catho fallback chain
- Trade-off: slower scans but essential for scoring — without description, matcher only uses title for compatibility
- Enrichment button is separate from scan button (enriching existing jobs vs finding new ones)

**How to apply:** New Playwright scrapers should include `_enrich_descriptions()` method. Check rate limits before adding platforms. Adzuna free tier (500 req/month) is tight — rate_limiter.py enforces max 1 run/day. Jobs without descriptions can be enriched on-demand via the frontend button or `POST /jobs/enrich`.
