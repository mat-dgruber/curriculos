---
name: User Profile - Matheus Diniz
description: Developer building JobHunter, a job application automation tool. Angular/Python stack. Portuguese speaker. Values holistic understanding.
type: user
---

Matheus Diniz is a developer working on **JobHunter**, a personal job application automation tool. Key details:

- **Primary stack**: Angular 21+ (frontend) + Python/FastAPI (backend)
- **Experience level**: Intermediate — has working knowledge of Angular, Python, HTML/CSS, is building a complex full-stack project
- **Language**: Brazilian Portuguese — always respond in Portuguese
- **Current focus**: MVP implementation in progress — Phase 1 scaffold (Angular frontend + FastAPI backend) running in parallel agents
- **Goal**: Automate job searching and CV submission to avoid repetitive manual work across multiple platforms (LinkedIn, Gupy, Vagas.com, corporate sites)
- **Workflow preference**: Values parallelism — asked to dispatch subagents for independent tasks instead of sequential execution
- **Design approach**: Plans thoroughly before coding — created full PRD, Architecture, AI Rules, and 80-step PLAN before any implementation
- **Understanding style**: Wants to understand the full system holistically before implementing — asked for complete end-to-end explanation covering user flow, company impact, communication, security, and data records. Thinks from UX, business, and security perspectives simultaneously, not just code
- **Documentation preference**: After receiving technical specs and ADRs, asked for readable .md guide documents specifically for learning/reading — values accessible documentation alongside formal specs
- **Infra knowledge**: No prior experience with managed databases or cloud hosting — asked if PostgreSQL needs to be downloaded/installed locally. Needed clear explanations of "managed vs self-hosted" concepts
- **Cost-conscious**: Researched Railway pricing before asking (knew about 0.5GB limit, $1/month credit). Actively seeks free or cheap alternatives. Values control over infrastructure costs
- **Infrastructure decision (2026-05-31)**: DECIDED — Firebase Hosting (frontend) + Oracle Cloud Always Free VM ARM (backend, Docker) + SQLite local on VM. All 11 docs updated to reflect this. User rejected Railway free (too small), Google Cloud (trial expires), Firebase Functions (can't run Playwright). Chose SQLite for production too (not just dev) — single-user doesn't need PostgreSQL
- **Thorough update workflow**: After infra decision, user asked to update ALL specs, ADRs, and guides — wants complete consistency across all documentation before moving to implementation
- **Growth mindset**: Plans to scale from single-user to multi-user in the future. Asked for a scaling roadmap — wants to understand the full path before starting. Interested in Supabase Free as PostgreSQL option when scaling
- **Scaling roadmap created (2026-05-31)**: 3 phases documented — Phase 1 (2-10 users: +Firebase Auth, +Supabase PG, $0/mês), Phase 2 (10-100: +Celery+Redis, $0-25/mês), Phase 3 (100+: +Kubernetes, $50-500/mês). ADR-005 being created to document this
