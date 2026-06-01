---
name: JobHunter Project Context
description: Job platform evolving from personal automation tool to two-sided marketplace — companies post jobs, users search. Angular 21+ / FastAPI / Playwright. Oracle Cloud Free + Firebase + SQLite. MVP DONE, docs complete, Fase 1-3 DONE (101 tests).
type: project
---

JobHunter is evolving from a **personal-use** automated job application system into a **two-sided job marketplace**.

**Core features (existing, MVP DONE):**
- Scrapes job listings from 5 platforms: LinkedIn (Playwright), Gupy (HTTP API), Vagas.com (Playwright), Jooble (REST API), Adzuna (REST API)
- Scores jobs by compatibility with user profile (role 40pts, keywords 30pts, location 20pts, platform 10pts)
- Auto-submits CV (PDF) via Playwright browser automation
- Maintains "fixed companies" list with monthly recurring CV submissions
- Sends email notifications for matches and submissions
- CV upload now functional (saves to storage/cv/{id}.pdf, validates PDF + 10MB limit)

**Documentation (completed 2026-06-01):**
- 14 documentation files (~4,500 lines total) covering roadmap, testing, APIs, features, infrastructure, scaling
- READMEs: root + 6 subdirectories

**Frontend animated icons (completed 2026-06-01):**
- 24 standalone Angular icon components created in `shared/components/*-icon/`
- All inline SVGs replaced in 14 consumer components (sidebar, topbar, job-detail, jobs-list, select, profile, settings, empty-state, toast, stat-card, dashboard, companies, applications)
- Animation source: itshover.com (18 icons) + CSS custom (6 icons)
- Pattern: `host.style` + `input()` signals + CSS transitions on `:host:hover`
- Only 3 SVGs remain inline: 2 spinners (CSS animate-spin) + 1 static search in input field
- **User expects ALL icons migrated** — questioned the 3 remaining, open to converting them too for full uniformity

**Roadmap implementation status (2026-06-01):**
- ✅ Fase 1 (Stubs/Bugs): Upload CV, JobDetailComponent, DELETE candidaturas
- ✅ Fase 2 (Manutenção): Fix as any, pdf_handler.py, Alembic migrations
- ✅ Fase 3 (Scrapers): Jooble + Adzuna REST scrapers integrated, 6 unit tests
- ⬜ Fase 4 (B2B): Company job posting system (next priority)
- ⬜ Fase 5-7: UX, infra, IA (deferred)

**Tests:** Backend **101 pytest tests** passing (79 original + 6 Fase 1-2 + 6 scrapers).

**Infrastructure:**
- Frontend: Firebase Hosting (Spark plan, free)
- Backend: Oracle Cloud Always Free VM ARM (Docker, never expires)
- Database: SQLite local on VM (async: sqlite+aiosqlite, WAL mode)
- **Planned migration:** PostgreSQL on home PC server (plan in memory)
- Total cost: $0/month
- Scaling: ADR-005 documented (Phase 1-3 roadmap)

**Known issues:**
- `core/deps.py` referenced in docs but `get_db` lives in `database.py` (keep as-is)
- `datetime.utcnow()` deprecation warnings throughout (low priority)

**How to apply:** Follow roadmap in docs/roadmap.md. Architecture in docs/adr/. User works phase by phase, asks to implement next phase. Parallel subagents preferred. Use .set()/.update() for Angular signals.
