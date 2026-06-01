---
name: JobHunter Project Context
description: Job platform evolving from personal automation tool to two-sided marketplace — Angular 21+ / FastAPI / Playwright. Oracle Cloud Free + Firebase + SQLite. Fase 1-3+5 DONE, 101 tests, 5 scrapers, light mode, PrimeNG FileUpload, InputComponent, ButtonComponent.
type: project
---

JobHunter is evolving from a **personal-use** automated job application system into a **two-sided job marketplace**.

**Core features (existing, MVP DONE):**
- Scrapes job listings from 5 platforms: LinkedIn (Playwright), Gupy (HTTP API), Vagas.com (Playwright), Jooble (REST API), Adzuna (REST API)
- Scores jobs by compatibility with user profile (role 40pts, keywords 30pts, location 20pts, platform 10pts)
- Auto-submits CV (PDF) via Playwright browser automation
- Maintains "fixed companies" list with monthly recurring CV submissions
- Sends email notifications for matches and submissions
- CV upload functional (saves to storage/cv/{id}.pdf, validates PDF + 10MB limit)

**Documentation (completed 2026-06-01):**
- 14+ documentation files (~4,500+ lines)
- READMEs: root + 6 subdirectories (backend, frontend, docs, tests, app, services)
- `docs/roadmap.md` — Master roadmap with status tracking (Fase 1-3 + 5 COMPLETO)
- `docs/future-features.md` — 10 future features (B2B, Auth, IA, Analytics, PWA, Gamificação, LGPD)
- `docs/infrastructure-production.md` — 1600+ lines Oracle VM/infra/deploy/security/troubleshooting
- `docs/scaling-plan.md` — 550 lines, Phase 0→3 scaling with diagrams + checklists
- `docs/api-vagas.md` — API research (Jooble, Adzuna, Remotive, JSearch, LinkedIn limitations)
- `docs/test-manual.md` — Step-by-step manual testing guide per page
- `.gitignore` created at root, `.env` and `__pycache__` removed from git tracking

**Frontend features (completed 2026-06-01):**
- Dashboard charts (Chart.js + ng2-charts): vagas por plataforma, candidaturas/semana, resumo section
- Notifications in-app: NotificationCenterComponent + NotificationService (localStorage persistence, 50 max)
- Dark/light mode: ThemeService + CSS variables, toggle in topbar AND profile page
- Light mode CSS: CSS custom properties (--bg-main, --bg-surface, etc.) toggled via .dark/.light classes; comprehensive overrides in styles.css; no pure white, Tailwind slate scale base
- PWA: @angular/service-worker, manifest.webmanifest, ngsw-config.json, placeholder icons
- Mobile: bottom nav (rounded, glassmorphism, `border-radius: 24px`, floating with margin), sidebar hidden on mobile
- `.gitignore` at root: covers __pycache__, .env, *.pyc, *.db, node_modules, .venv, IDE files, OS files, Playwright reports, etc.

**Settings merged into Profile (2026-06-01):**
- `/settings` route removed — all settings (theme, keywords, roles, locations, automation) now live in `/profile`
- Profile page is bento grid: personal data (2/3) + CV upload (1/3) + theme toggle + tags (keywords/roles/locations) + automation config
- Sidebar and bottom nav no longer have a Settings item
- `SettingsComponent` still exists at `features/settings/` but is no longer routed — can be deleted later
- Unified save: single "Salvar Tudo" button saves profile + settings in one API call

**Jobs page overhaul (2026-06-01):**
- Glassmorphism cards with accent bar per score (green >=80, yellow >=60, orange >=40, red <40)
- List/Grid view toggle (persisted in localStorage via effect + signal init, survives reload)
- Sort default: score desc (changed from found_at desc)
- Search: 300ms debounce (Subject + debounceTime + distinctUntilChanged) + subtle spinner (no skeleton flash)
- SQL LIKE wildcard escaping in backend (escape="\\") — prevents % and _ from acting as wildcards
- Scan button: polling every 2s (interval + switchMap + takeWhile), 409 cooldown guard, success/error banners (green/red), scan_state singleton
- Backend: PATCH endpoint `/jobs/{id}` for job updates, sort_by/sort_order params, GET `/jobs/scan/status`
- Backend scan_state singleton (thread-safe, threading.Lock) with status states: idle → running → completed/failed
- Fixed: withComponentInputBinding() for route params, StatusChip missing in list, empty state button not wired, input `jobId` renamed to `id` to match route param
- PlatformClassPipe extracted to shared (eliminated duplicate getPlatformClass() in list + detail)
- RelativeTimePipe updated to accept `string | Date | null` (was only string)
- applications.service.spec.ts fixed (string args → typed objects)
- Detail page: full-width (no max-w constraint), bento grid 2-col responsive
- Job detail: back button, confirm modal before apply, auto Nova→Visualizada transition
- Icon host style workaround: Angular `host: { style: '...' }` overrides Tailwind classes — wrapper div didn't work, inline SVG in template is the fix

**Light mode inline style fixes (2026-06-01):**
- Inline `style="background: rgba(17,24,39,...)"` cannot be overridden by CSS class selectors — replaced with `.glass`, `.glass-strong` utility classes that use `var()` references
- Components fixed: topbar, sidebar (desktop + mobile), bottom nav, notification center panel, sidebar tooltip
- `.card` class added to global styles.css (was undefined — companies page had empty invisible cards)
- Tag cards (keywords/roles/locations) use `flex flex-col` + `mt-auto` on input row to push input+button to card bottom

**PrimeNG FileUpload (2026-06-01):**
- Profile CV upload uses `p-fileupload` with `mode="advanced"` for full visual control
- `mode="basic"` shows browser's "No file chosen" text — cannot be hidden with CSS
- `mode="advanced"` with `<ng-template #empty>` + `[showUploadButton]="false" [showCancelButton]="false"` for clean UI
- Custom upload: `[customUpload]="true"` + `(onSelect)="onFileUpload($event)"` for file selection
- CSS classes `.cv-upload-zone` (dashed border drop zone) and `.cv-upload-compact` (simple button) in styles.css

**Tag cards layout (2026-06-01):**
- Keywords, Roles, Locations cards use `flex flex-col` on container
- Tags area has NO `flex-1` — tags take natural size, don't stretch to fill card
- Input+button row has `mt-auto` to stay at card bottom regardless of tag count
- Linter may try to add `flex-1` back — reject it, badges must stay standard size

**InputComponent integration (2026-06-01):**
- `InputComponent` at `shared/components/input/input.component.ts` — standalone, ControlValueAccessor, icon via `[innerHTML]`, CSS `:has()` auto-adjusts padding
- Added `valueChange` output to InputComponent for child-to-parent communication
- `sanitizedIcon` computed signal is REQUIRED when using `[innerHTML]="sanitizedIcon()"` — must inject `DomSanitizer` and create `computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.icon()))` — without this, Angular strips SVG tags entirely
- Search input in jobs-list now uses `<app-input [icon]="searchSvg">` instead of raw `<input>` + `SearchIconComponent`
- `searchSvg` is a raw SVG string passed via `[icon]` input, rendered with `[innerHTML]` through sanitizedIcon
- `SearchIconComponent` still used in "Buscar vagas agora" button (flow context, not absolute)

**Requirements as badges (2026-06-01):**
- Requirements field stores JSON strings like `'["Angular 15+", "TypeScript", "RxJS"]'`
- Parsed with `JSON.parse()` in a `computed()` signal, falls back to `[req]` if not JSON array
- Rendered as pill badges: `bg-primary/10 border border-primary/20 text-primary rounded-full`

**Default sort (2026-06-01):**
- Jobs list default sort changed from `found_at desc` to `score desc`

**Roadmap implementation status (2026-06-01):**
- ✅ Fase 1 (Stubs/Bugs): Upload CV, JobDetailComponent, DELETE candidaturas
- ✅ Fase 2 (Manutenção): Fix as any, pdf_handler.py, Alembic migrations, pdfplumber dep
- ✅ Fase 3 (Scrapers): Jooble + Adzuna REST scrapers integrated, 6 unit tests
- ⬜ Fase 4 (B2B): Company job posting system (SKIPPED by user — may revisit later)
- ✅ Fase 5 (UX): Dashboard charts, Notifications in-app, Dark/light mode, PWA, Mobile responsiveness
- ✅ Light mode: CSS variables + overrides in styles.css, global button classes, service worker disabled in dev
- ✅ Component standardization: InputComponent + ButtonComponent at shared/components/. CSS base classes (.input-field, .btn-primary, .btn-secondary) in styles.css with theme-aware variables.

**Tests:** Backend **101 pytest tests** passing. Frontend test suite runs with 2 pre-existing failures (select.spec.ts click issue, app.spec.ts needs backend).

**Home server PostgreSQL (2026-06-01):**
- Complete guide at docs/home-server-guide.md (10 phases, ~2.5h implementation)
- Covers: Ubuntu Server install, PostgreSQL setup, Tailscale, backups, JobHunter connection
- Backend needs: change .env DATABASE_URL to postgresql+asyncpg, pip install asyncpg, run alembic migrations

**Infrastructure:**
- Frontend: Firebase Hosting (Spark plan, free)
- Backend: Oracle Cloud Always Free VM ARM (Docker, never expires)
- Database: SQLite local on VM (async: sqlite+aiosqlite, WAL mode)
- Total cost: $0/month

**Database config:**
- Engine: `backend/app/core/database.py` — `create_async_engine` + `async_sessionmaker`
- Driver: `sqlite+aiosqlite` (async, WAL mode) — drop-in replacement: `postgresql+asyncpg`
- 4 tables: `jobs`, `applications`, `fixed_companies`, `candidate_profiles`
- `alembic.ini` + `alembic/env.py` configured for async migrations
- `create_all` removed from startup — use `alembic upgrade head` instead

**Mobile navigation decision (2026-06-01):**
- Sidebar is desktop-only (`hidden md:block` in app.html)
- Bottom nav handles all navigation on mobile
- Bottom nav order: Dashboard, Candidaturas, Empresas, **Vagas (index 3)**, Perfil
- Vagas is highlighted: larger icon (24px vs 22px), elevated with `translateY(-4px)`, glow shadow when active
- No hamburger menu — bottom nav is sufficient
- Bottom nav styled: `border-radius: 24px`, `margin: 12px`, floating glassmorphism, safe-area padding

**Dependencies:**
- `pdfplumber>=0.11.0` — PDF text extraction for CVs
- `chart.js` + `ng2-charts` — Dashboard charts
- `@angular/service-worker` — PWA support
- `asyncpg` — PostgreSQL async driver (for future migration)

**Known issues:**
- `core/deps.py` referenced in docs but `get_db` lives in `database.py` (keep as-is)
- `datetime.utcnow()` deprecation warnings throughout (low priority)
- OOM crashes possible in other sessions when running many parallel agents
- Frontend subagents fail ~60% on multi-file tasks; backend tasks succeed ~95%
- Service worker disabled in dev — was causing 404 errors
- Seed data (job-1, job-2, job-5) has full descriptions; real scraped jobs from LinkedIn often have empty descriptions — scraper limitation, not a bug
- Requirements stored as JSON strings `'["Angular 15+", "TypeScript"]'` — must be parsed with `JSON.parse()` before rendering

**Feito na sessão 2026-06-01 (tarde):**
- Scan polling fix: Subject + takeUntil pattern (cancela poll anterior antes de iniciar novo)
- ToastService global: signal-based, auto-dismiss, bottom-right container, slide-in animation
- Integrado em jobs-list (scan feedback) e job-detail (candidatura feedback)

**Pendente (Proxima Sessão):**
- Infinite scroll na paginacao
- Filtros na URL (query params)
- Dark mode toggle no sidebar

**How to apply:** Follow roadmap in docs/roadmap.md. User can skip phases. Parallel subagents preferred (cap 5-6). Use .set()/.update() for Angular signals. InputSignal is read-only — use output() for child-to-parent. Sidebar is desktop-only, bottom nav for mobile. withComponentInputBinding() required for route param injection. Settings live inside Profile page — no separate /settings route. When using `[innerHTML]` for SVGs, wrap with `DomSanitizer.bypassSecurityTrustHtml()`.
