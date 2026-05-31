---
name: JobHunter Project Context
description: Personal job automation tool — Angular 21+ frontend, FastAPI backend, Playwright scraping. Infra: Oracle Cloud Free + Firebase Hosting + SQLite. All 13 docs complete. MVP Phase 1 scaffold DONE.
type: project
---

JobHunter is a **personal-use** automated job application system being built by Matheus Diniz.

**What it does:**
- Scrapes job listings from LinkedIn, Gupy, Vagas.com
- Scores jobs by compatibility with user profile (role 40pts, keywords 30pts, location 20pts, platform 10pts)
- Auto-submits CV (PDF) via Playwright browser automation
- Maintains "fixed companies" list with monthly recurring CV submissions
- Sends email notifications for matches and submissions

**Current phase (2026-05-31):** MVP Phase 1 scaffold — **COMPLETED**.

**Frontend (Angular 21+):** 27 TypeScript files. Build passes clean (279KB initial bundle).
- 13 components: sidebar, topbar, dashboard, jobs-list, job-detail, applications, companies, profile, settings, score-badge, status-chip, stat-card, empty-state
- 5 services: api, jobs, applications, companies, profile (HttpClient-based)
- 4 models: job, application, company, profile (TypeScript interfaces)
- 1 pipe: relative-time
- 7 lazy-loaded routes with loadComponent()
- Tailwind 3.4.17 configured with dark theme tokens (#0a0f1e bg, #2563eb primary)
- PrimeNG 21+ installed (needed `--legacy-peer-deps` + separate `@angular/animations`)
- app.config.ts: provideHttpClient(withFetch()), provideAnimationsAsync(), provideRouter()

**Backend (FastAPI):** 17 Python files. Server verified working on port 8000.
- 5 route files with placeholder endpoints: jobs, applications, companies, profile, scheduler
- core/config.py: pydantic-settings reading .env (DATABASE_URL=sqlite+aiosqlite)
- core/database.py: SQLAlchemy async engine + init_db() on startup
- main.py: CORS for localhost:4200, /health endpoint, all routers mounted at /api/v1
- .env configured for local development
- Dependencies via uv: fastapi, uvicorn, sqlalchemy, aiosqlite, pydantic-settings, alembic, python-multipart

**Next:** Phase 2 (Models & Database, Steps 12-17) — create real SQLAlchemy models, Alembic migrations, seed data. Then Phase 3 (API Endpoints, Steps 18-25).

**Infrastructure:** Oracle Cloud Free VM ARM (Docker) + Firebase Hosting + SQLite. $0/month. Scaling plan: Phase 1→Supabase Free, Phase 2→Celery+Redis, Phase 3→Kubernetes.

Environment verified: Node 24.13.1, npm 11.8.0, Angular CLI installed, Python 3.14.3 (via uv), uv 0.10.6, Git 2.50.1.

**Doc inventory (13 files — all complete):**
- `docs/specs/` — frontend-components, api-endpoints, data-models, scraping-automation, infrastructure
- `docs/adr/` — 001-stack-choices, 002-scraping-strategy, 003-scheduling-jobs, 004-database-strategy, 005-scaling-strategy
- `docs/` — user-guide, technical-guide, developer-guide

**Why:** The user wants to stop manually checking job platforms and filling repetitive forms. Recurring monthly submissions to "fixed companies" is key — companies prioritize recent CVs.

**How to apply:** Follow PLAN.md step by step. Architecture decisions in docs/adr/. Specs in docs/specs/. User prefers parallel subagents for independent tasks.
