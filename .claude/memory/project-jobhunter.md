---
name: JobHunter Project Context
description: Personal job automation tool — Angular 21+ frontend, FastAPI backend, Playwright scraping. Infra: Oracle Cloud Free + Firebase Hosting + SQLite. All 13 docs complete. MVP Phase 1 scaffold nearly done.
type: project
---

JobHunter is a **personal-use** automated job application system being built by Matheus Diniz.

**What it does:**
- Scrapes job listings from LinkedIn, Gupy, Vagas.com
- Scores jobs by compatibility with user profile (role 40pts, keywords 30pts, location 20pts, platform 10pts)
- Auto-submits CV (PDF) via Playwright browser automation
- Maintains "fixed companies" list with monthly recurring CV submissions
- Sends email notifications for matches and submissions

**Current phase (2026-05-31):** MVP Phase 1 scaffold — **IN PROGRESS**:
- **Backend (Steps 7-10): COMPLETED.** FastAPI server verified working on port 8000. 5 route files (jobs, applications, companies, profile, scheduler) with placeholder endpoints. SQLAlchemy async + SQLite configured. CORS for localhost:4200. pydantic-settings reading .env. Dependencies: fastapi, uvicorn, sqlalchemy, aiosqlite, pydantic-settings, alembic, python-multipart.
- **Frontend (Steps 1-6): MOSTLY DONE.** Angular 21+ scaffolded, Tailwind 3.4.17 configured with dark theme tokens, PrimeNG 21 installed (needed `--legacy-peer-deps`), environments created, 8 lazy-loaded routes configured, HttpClient + animations providers added. **Subagent currently creating all components** (sidebar, topbar, dashboard, jobs, applications, companies, profile, settings, shared components, pipes, models, services).

**Implementation lesson:** PrimeNG 21 requires `--legacy-peer-deps` with Angular 21 due to peer dep mismatch. `@angular/animations` must be installed separately.

**Next after Phase 1 completes:** Phase 2 (Models & Database, Steps 12-17), Phase 3 (API Endpoints, Steps 18-25).

Environment verified: Node 24.13.1, npm 11.8.0, Angular CLI installed, Python 3.14.3 (installed via uv), uv 0.10.6, Git 2.50.1.

**Doc inventory (13 files — all complete):**
- `docs/specs/` — frontend-components, api-endpoints, data-models, scraping-automation, infrastructure
- `docs/adr/` — 001-stack-choices, 002-scraping-strategy, 003-scheduling-jobs, 004-database-strategy, 005-scaling-strategy
- `docs/` — user-guide, technical-guide, developer-guide

**Key project docs:** PRD.md, ARCHITECTURE.md, AI_RULES.md, PLAN.md (80 steps across 13 phases)

**Why:** The user wants to stop manually checking job platforms and filling repetitive forms. Recurring monthly submissions to "fixed companies" is key — companies prioritize recent CVs.

**How to apply:** Follow PLAN.md step by step. Architecture decisions in docs/adr/. Specs in docs/specs/. User prefers parallel subagents for independent tasks.
