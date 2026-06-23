---
name: Scraper Orchestrator — Implemented
description: Fase 3+ — orquestrador HttpScraper/PlaywrightScraper com 7 platforms ativos (Jooble/Catho desativadas 2026-06-23, Gupy migrada pra portal)
type: project
---

Scraper orchestrator fully implemented. As of **2026-06-23**, the registry is **7 platforms** (was 8). 107+ backend tests passing. Two platform removals this session after user audit when live scan returned only 3 vagas with 4 errors.

**Architecture:**
```
ScraperProtocol (typing.Protocol)
├── HttpScraper (ABC) ──── httpx, no Playwright overhead
│   ├── GupyPortalScraper  (NEW 2026-06-23, was GupyScraper)
│   ├── ArbeitnowScraper   (NEW 2026-06-23, Jooble replacement)
│   ├── AdzunaScraper      (creds agora em .env: ADZUNA_APP_ID/KEY)
│   ├── RemotiveScraper
└── PlaywrightScraper (ABC) ──── browser + helpers
    ├── LinkedInScraper, VagasScraper, InfoJobsScraper
    └── (Catho REMOVIDA — anti-bot bloqueia definitivamente)
```
- `ScraperOrchestrator` at `backend/app/services/scraper/orchestrator.py`: `asyncio.gather` concurrency, per-platform error isolation
- Config: `enabled_scrapers` in Settings (comma-separated, empty = all platforms)
- `scan_service.py` refactored to use orchestrator instead of sequential loop

**Why Catho was removed:** Even with Playwright + headless fallback chain, Catho's Cloudflare distinguishes scripted browsers and returns "Operação Inválida". User decision: `B - Desativar`.

**Why Jooble was removed:** Free signup key flow is friction; user replaced with **Arbeitnow** which needs no auth (`reference-arbeitnow-api.md`).

**Why Gupy was migrated:** The legacy `https://api.gupy.io/api/job` returns 404/401 for unauthenticated callers. `GupyPortalScraper` now scrapes `https://portal.gupy.io/job/<term>` extracting `__NEXT_DATA__` JSON (`reference-gupy-portal-scraping.md`).

**Why Adzuna now works:** User pasted creds (`ADZUNA_APP_ID`/KEY) into `.env` on 2026-06-23 after registration. 250 req/month free tier — `rate_limiter.py` keeps at 1/day to avoid burn.

**Post-removal dead code:** Files `jooble_scraper.py`, `gupy_scraper.py`, `catho_scraper.py` still on disk but no longer imported by orchestrator. Future sweep can delete: skew per registry truth.

**Test migration caveat:** Renaming/replacing scrapers requires migrating `tests/test_scrapers.py` **in the same commit** as orchestrator changes — old imports break pytest collection (CollectionError before any test runs).

**How to apply:**
- Adding new platform: create `app/services/scraper/<name>_scraper.py`, register in `orchestrator._register_defaults`, add test in `tests/test_scrapers.py`. All in one commit.
- Removing platform: same — orchestrator + tests + dead-code file deletion ideally co-committed.
- When scan returns ≤3 vagas with many errors: don't assume rate limit. Audit each platform's URL/path; public APIs deprecate fast. Combine replacement options (Arbeitnow as Jooble substitute; portal-scraping as API substitute; signup as Adzuna rescue; deactivation as Catho choice) and let user pick per `feedback-combine-all.md`.
