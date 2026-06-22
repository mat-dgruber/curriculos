---
name: JobHunter Project Context
description: Job platform evolving from personal automation tool to two-sided marketplace — Angular 21+ / FastAPI / Playwright. 107 tests, 8 scrapers with orchestrator.
type: project
---

JobHunter is evolving from a **personal-use** automated job application system into a **two-sided job marketplace**.

**Core features (existing, MVP DONE):**
- Scrapes job listings from 8 platforms: LinkedIn (Playwright), Gupy (HTTP API), Vagas.com (Playwright), Jooble (REST API), Adzuna (REST API), Remotive (HTTP, free), InfoJobs (Playwright), Catho (Playwright)
- Orchestrator pattern with asyncio.gather concurrency, per-platform error isolation
- Scores jobs by compatibility with user profile (role 40pts, keywords 35pts, location 15pts, platform 5pts; -20pt penalty for zero keyword matches; MIN_SCORE=20 filter; auto Remoto match; trusted platforms: linkedin, gupy, infojobs, catho)
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
- **Favoritos (is_favorite) de vagas (Fase 5 - UX):** Adicionado campo `is_favorite` no banco de dados via Alembic (`e2f3a4b5c6d7_add_is_favorite_to_jobs.py`), atualizando os schemas do Pydantic (JobCreate, JobRead, JobUpdate) e rota de GET `/jobs` para permitir o filtro por favoritos. No frontend, a interface `Job` e o filtro foram atualizados. Implementado o filtro "Favoritas" na barra de buscas e botão absoluto de coração vermelho nos cards de grade e lista, além de um botão na barra de ações da página de detalhes. Os cards favoritados recebem destaque dinâmico glassmorphism avermelhado sutil (`border-red-500/20` e `bg-red-500/5`). Corrigido problema de navegação acidental ao favoritar nos cards aplicando `event.preventDefault()`, `event.stopPropagation()` e `type="button"` nos botões de favoritos. O filtro "Favoritas" na barra de listagem de vagas foi realinhado de forma uniforme aos demais selects (largura `w-full sm:w-40` e depois otimizado para `w-full sm:w-28` para caber inline com todos os filtros) e unificado em uma única linha no desktop utilizando `lg:flex-nowrap`, compactação dos selects e remoção de labels redundantes (como "Ordenar:"). Implementado um **Empty State personalizado para favoritos**, que exibe mensagem acolhedora ("Nenhuma vaga favoritada"), descrição instrutiva ensinando a usar o ícone de coração e ícone `'inbox'` ao invés de buscar vagas comuns caso o filtro esteja ativo e vazio.

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
- ✅ Fase 3 (Scrapers): COMPLETO — 8 platforms com orquestrador (asyncio.gather). Todos os scrapers (incl. Remotive, InfoJobs, Catho) integrados. Frontend filters e notification_service atualizados.
- ⬜ Fase 4 (B2B): Company job posting system (SKIPPED by user — may revisit later)
- ✅ Fase 5 (UX): Dashboard charts, Notifications in-app, Dark/light mode, PWA, Mobile responsiveness
- ✅ Light mode: CSS variables + overrides in styles.css, global button classes, service worker disabled in dev
- ✅ Component standardization: InputComponent + ButtonComponent at shared/components/. CSS base classes (.input-field, .btn-primary, .btn-secondary) in styles.css with theme-aware variables.

**Tests:** Backend **122 pytest tests** passing. Frontend build succeeds with no errors.

**Memory hardening (2026-06-22):** Detalhes completos em `project-vm-production-incident.md` — container `mem_limit: 700m` + `mem_reservation: 500m` + `pids_limit: 200`, `PLAYWRIGHT_SLOW_MO=0` em prod, swap 2 GB no host (vm.swappiness=10). Patches aplicados: `enrichment_service` em batches de 5 vagas (fecha/reabre Playwright, `gc.collect()` entre batches, commit por batch). `scheduler_service.trigger_job` rejeita scan manual concorrente e adquire lock antes de criar task. Helper `_release_job_lock(job_id)` substitui `is_running=False` nos 3 wrappers e adiciona gc.collect() best-effort. Cron `@reboot + */5 * * * * monitor + 0 4 * * * restart diário` em `/home/ubuntu/scripts/`, log `/var/log/jobhunter-monitor.log`.

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

**Candidaturas page overhaul (2026-06-01):**
- Fixed bug: `app.jobId` (UUID) replaced with `app.jobTitle` (readable title) in both table and mobile cards
- Pagination added: `currentPage`/`totalPages` signals, Previous/Next buttons, `page`/`per_page: 20` params to API
- Search with debounce: `Subject<string>` + `debounceTime(300)` + `distinctUntilChanged()`, uses shared `InputComponent`
- Rows and cards now clickable: `routerLink` to `/applications/:id` on table `<tr>` and mobile `<a>` elements
- New detail component: `ApplicationDetailComponent` at `features/applications/application-detail/`
- Detail shows: job title, company, status, type (Único/Recorrente), sentAt, createdAt, errorMessage, notes, screenshotPath
- Status update on detail: `computed()` + `validTransitions` map shows only valid next states (not a fixed list)
- Route `applications/:id` added to `app.routes.ts`
- `getApplication(id)` added to `ApplicationsService`
- Pattern follows `JobDetailComponent`: `input<string>('')` + `effect()` for route params
- List/Grid view toggle: `viewMode` signal persisted in `localStorage` via `effect()`, same pattern as jobs-list
- Grid view shows cards with job title, company, status, time, type, and error preview
- Fixed: Added `deleteApplication(id)` and `registerClick(id)` to `ApplicationsService`
- Security (XSS protection): Replaced unsafe `bypassSecurityTrustResourceUrl` with strict regex validation `/^(https?:\/\/|\/|assets\/)/i` and safe native `DomSanitizer.sanitize(SecurityContext.URL, path)` for `screenshotPath`
- Concurrency (Race conditions protection): Search and pagination in `ApplicationsComponent` now cancels preceding active requests with `activeSub?.unsubscribe()` in both `loadApplications()` and `ngOnDestroy()`
- Job details integration: Injected `JobsService` in `ApplicationDetailComponent` to load the respective Job, enabling external "Ver Vaga" redirection link (responsive on both mobile & desktop) when `job.url` is available (or fall back to local route)
- Auto-click tracking: When the external job link is clicked, it automatically triggers `registerClick(id)` to update backend and increment clicks dynamically in the UI
- Click counter display: Added a dedicated reactive clicks section in the "Informações" Bento Grid inside the application detail view
- Custom status dropdown: Replaced native HTML `<select>` with `<app-select>` (using `SelectComponent` and `SelectOption`), adding descriptive icons/emojis for each status (💼 Todos, ⏳ Pendente, 🚀 Enviado, ❌ Falhou, 📁 Arquivado)
- Cleaned constructor side-effects: Refactored `_viewModeEffect` into a clean `constructor()` block in `ApplicationsComponent` to eliminate TypeScript unused-variable warnings and align with Angular best practices
- Custom dropdown z-index fix: Resolved the dropdown options getting hidden behind the application cards underneath by adding 'relative z-30' utility class to the filters parent container in `applications.component.ts`, resolving stacking contexts created by backdrop-blur and position elements.

**Backend fixes for Candidaturas (2026-06-01):**
- GET /applications/{id} endpoint was MISSING — created with `selectinload(Application.job)` for eager loading
- `ApplicationRead` model was missing `job_title` field — added `job_title: str = ""` and `_to_read()` helper
- Search endpoint uses `JOIN` on `Job.title.ilike()` + `Application.company_name.ilike()` — no `job_title` column on applications table
- **Correção de Paginação no Backend (422 Unprocessable Content):** O limite superior do parâmetro de query `per_page` nos endpoints de `/jobs` e `/applications` foi aumentado de `le=100` para `le=1000` via FastAPI `Query()`. Isso corrigiu o erro HTTP 422 na página de dashboard, onde o frontend precisava carregar grandes blocos (`per_page=200` para vagas e `per_page=500` para candidaturas) de uma vez só para agregar e renderizar os gráficos de estatísticas corretamente.
- Status transitions were too restrictive — added: Arquivado→Pendente, Enviado→Falhou, Falhou→Enviado
- All endpoints now return `job_title` via `_to_read()` helper that reads `a.job.title` from the relationship

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
- Seed data (job-1, job-2, job-5) has full descriptions; Playwright scrapers now enrich descriptions by navigating to detail pages (max 15 per search) — slower but essential for scoring accuracy
- Requirements stored as JSON strings `'["Angular 15+", "TypeScript"]'` — must be parsed with `JSON.parse()` before rendering

**Feito na sessão 2026-06-01 (tarde):**
- Scan polling fix: Subject + takeUntil pattern (cancela poll anterior antes de iniciar novo)
- ToastService global: signal-based, auto-dismiss, bottom-right container, slide-in animation
- Integrado em jobs-list (scan feedback) e job-detail (candidatura feedback)

**Feito na sessão 2026-06-01 (noite) — Melhorias e Otimizações de Empresas Fixas (Fase 5 - UX):**
- **Edição de Empresas Fixas:** Adicionado suporte completo à edição de nome, URL, intervalo e notas na UI de Empresas Fixas. O formulário foi reestruturado para ser dinâmico e inteligente, alternando entre cadastro/edição usando o Signal `editingCompany`.
- **Validações Reativas e Visuais:** Validações em tempo real no formulário usando `computed` signals do Angular (`formNameError`, `formUrlError`, `formIntervalError` e `isFormValid`). Mensagens de erro visuais amigáveis aparecem abaixo dos inputs quando inválidos e o formulário é submetido. O input de Notas foi migrado para um `<textarea>` estilizado para maior espaço.
- **Registro de Envio Manual (Record Sent):** Criada rota `POST /companies/{company_id}/record-sent` no backend e método correspondente no frontend (`CompaniesService.recordSent`). Adicionado botão reativo **"Registrar Envio"** nos cards (usando `<app-send-icon>`), que incrementa reativamente o contador `total_sent` e atualiza as datas de último/próximo envio.

**Feito na sessão 2026-06-01 (noite) — Análise Profunda e Otimizações do Perfil:**
- **Sincronização de Scheduler:** Implementada inicialização dinâmica do APScheduler consultando o banco de dados e método `reschedule_scan_job(hours)` acionado no PUT `/profile` para reagendar a varredura em tempo de execução sem reiniciar o servidor.
- **Validação de Assinatura PDF:** Adicionado magic bytes check (`b"%PDF"`) no upload do currículo, blindando o backend contra PDFs falsos.
- **Limpeza do Uploader:** Adicionado reset automático do uploader do PrimeNG via ViewChild `.clear()` após envio bem-sucedido.
- **Destaque Cromático de Temas:** Cards de seleção de tema agora exibem borda, hover e fundos baseados em suas próprias cores originais via variáveis de estilo `--theme-primary` e funções CSS modernas `color-mix()`.
- **Zona de Arraste Clicável:** Adicionado binding `(click)="cvUploadZone.choose()"` no template `#empty` do uploader para tornar toda a zona pontilhada de arraste clicável.
- **Sugestões de Tags Rápidas:** Criado painel de pílulas de sugestão rápida estáticas (Python, Angular, Remoto, etc.) que entram no formulário ao clicar. Discutida a evolução para IA ler o currículo em PDF (com `pdf_handler.py` e LLM) para sugerir de forma 100% personalizada.

**Feito na sessão 2026-06-01 (noite) — Análise Profunda e Otimizações do Dashboard (Fase 5 - UX):**
- **Unificação Reativa de APIs (Dashboard):** Chamadas concorrentes de API (`getJobs`, `getApplications`, `getStatus`) unificadas reativamente em uma única pipeline robusta utilizando o operador `forkJoin` do RxJS. O loading esqueleto de carregamento agora cobre todas as consultas de forma unificada e atômica.
- **Controle Direto do Agendador (Scheduler):** Adicionados botões interativos de ação na seção do robô de automação no Dashboard. O usuário agora pode ativar ou pausar o robô diretamente pelo painel (chamando `pause()` e `resume()`), além de disparar buscas manuais imediatas de novas vagas em segundo plano ("Buscar Vagas" usando `triggerJob('scan_jobs')`).
- **Gráfico de Vagas Dinâmico:** O gráfico de "Vagas por Plataforma" foi remodelado para ler dinamicamente do banco através de um `computed` signal baseado em `allJobs()`, extraindo de forma case-insensitive e dinâmica todas as plataformas encontradas pelo scraper, ordenando-as por frequência e agrupando plataformas menos frequentes sob a etiqueta "Outras".
- **Precisão de Fuso Horário Local:** O gráfico de candidaturas semanais foi reconfigurado para usar strings de data locais (`YYYY-MM-DD`) no fuso do próprio navegador, comparando-as com as datas locais dos últimos 7 dias. Isso elimina quaisquer inconsistências de fusos horários na agregação diária das estatísticas.

**Description Enrichment (2026-06-01):**
- Playwright scrapers fetch empty description on card listing — need separate detail page navigation
- `_enrich_descriptions()` method on LinkedIn, Vagas, InfoJobs, Catho scrapers (max 15 jobs per search)
- LinkedIn enrichment: CSS selectors + JS fallback (`document.querySelector` chain) — LinkedIn detail pages need login for some selectors, JS fallback grabs largest text block
- InfoJobs enrichment: CSS selectors + JS fallback with `#jobDescription`, `article`, `.detail-body`
- Remotive: HTML-stripped descriptions — `_strip_html()` removes `<p>`, `<a>` tags from API response, returns clean text (was returning raw HTML)
- Catho: blocks automated access with "Operação Inválida" — graceful skip, selectors are defensive fallbacks
- `enrichment_service.py` standalone service: `enrich_missing_descriptions(limit=50)` queries DB for jobs with empty description, opens browser, navigates to each URL, extracts text per-platform selectors
- `POST /jobs/enrich` endpoint triggers enrichment in background (asyncio.create_task)
- Frontend: "Preencher descricoes" button alongside "Buscar vagas agora" — uses `enriching` signal, polls every 5s for 60s
- Rate limiter: persistent JSON at `storage/scraper_rate_state.json` — Adzuna max 1/day, Remotive max 4/day

**Feito na sessão 2026-06-01 (noite) — Fase 3 Completa: Scraper Orchestrator:**
- **Arquitetura:** Criado `ScraperProtocol` + `HttpScraper` (httpx, sem Playwright) + `PlaywrightScraper` (browser + helpers). `BaseScraper` mantido como alias de compatibilidade.
- **Orquestrador:** `ScraperOrchestrator` em `orchestrator.py` — execução concorrente via `asyncio.gather` (antes sequencial), isolamento de erros, tracking per-platform com `ScraperResult`/`OrchestratorResult`, config `enabled_scrapers`.
- **Novos scrapers:** RemotiveScraper (HTTP, grátis, 4 req/dia, sem auth), InfoJobsScraper (Playwright, data-qa selectors), CathoScraper (Playwright, data-qa selectors).
- **Refactor existentes:** GupyScraper → HttpScraper, JoobleScraper/AdzunaScraper → HttpScraper (de standalone), LinkedInScraper/VagasScraper → PlaywrightScraper. `platform` class attr adicionada em todos.
- **Fixes:** Platform regex corrigido para 8 plataformas, bs4 import removido do linkedin_scraper, matcher atualizado (infojobs/catho no trusted bonus), notification_service agora lista todas as 8 plataformas dinamicamente (antes hardcoded 3).
- **Frontend:** platform-class.pipe.ts com cores para 8 plataformas, jobs-list.component.ts dropdown com 9 opções.
- **Seed:** Adicionados exemplos Remotive e Jooble ao seed data.
- **Roadmap:** Fase 3 marcada [COMPLETO] em todas as 8 plataformas.
- **Testes:** 107 passando, mocks atualizados para httpx no base_scraper (antes mockavam nos módulos errados).

**Contraste de Botões nos Temas (RESOLVIDO 2026-06-01):**
- Botões "Favoritar", "Excluir" e "Abrir vaga original" no JobDetail tinham `glass-v2` + `text-text-muted` que tinha contraste ruim nos temas light/capycro
- Solução: migrados para `btn-secondary` que já tem overrides para todos os temas
- Padrão: botões secundários devem usar `.btn-secondary` global (definido em styles.css), não `glass-v2` + classes de cor manuais

**Conformidade de Temas e Design System (RESOLVIDO 2026-06-01):**
- **4 Temas Dinâmicos Completos:** O `ThemeService` foi estendido para suportar o enum `'dark' | 'light' | 'capycro' | 'high-contrast'` com persistência automática no `localStorage`.
- **Overrides de Estilo Unificados:** Os overrides de classes do Tailwind em `styles.css` foram convertidos para o seletor `:is(.light, .capycro, .high-contrast)`, e utilizam variáveis semânticas de CSS e `color-mix()` para suportar os 4 temas de maneira universal e dinâmica.
- **Glassmorphism Inteligente:** O efeito translúcido de vidro com desfoque de fundo (`backdrop-filter`) foi refinado nas variáveis e ativado com opacidades equilibradas especificamente para `:is(.light, .capycro)` nos componentes de layout (sidebar, topbar, bottom nav). O estilo sólido e de alto contraste é isolado apenas no tema `.high-contrast` para conformidade WCAG AAA de acessibilidade.
- **Navegação Móvel 100% Dinâmica:** A barra de navegação móvel inferior (`mobile-bottom-nav.component.ts`) foi migrada de cores rígidas para as variáveis `var(--primary-color)` e `var(--primary-color-rgb)`.
- **Logotipo e Destaques:** O logotipo do sidebar e os seus botões de ação e status (no cabeçalho/topbar) respondem perfeitamente aos temas, herdam o fundo de superfície correto e usam a classe `.text-white-absolute` para manter o plugue branco nítido sobre botões primários escuros em todos os temas.
- **Botões Sólidos e Ergonômicos:** O `.btn-primary` e o `.btn-secondary` foram atualizados para formato de pílula (`rounded-full`), utilizando cores sólidas baseadas em `--primary-color` do tema ativo (sem gradientes ruidosos) e hover físico elástico suave com mola (`var(--transition-spring)` e `translateY(-2px) scale(1.02)`).
- **Badges e Status Chips Dinâmicos:** O `StatusChipComponent` e o `ScoreBadgeComponent` foram inteiramente migrados para a estética translúcida e de alto contraste "outline-filled" (`bg-X/15 text-X border border-X/20`), garantindo leitura e visibilidade cristalina sob hovers de cartões em todos os 4 temas.
- **Páginas em Conformidade:** As páginas de Candidaturas (`applications.component.ts`) e Empresas Fixas (`companies.component.ts`) foram redesenhadas com Ambient Blobs, Playfair Display (`font-serif`), staggered loading sequencial e uso de cartões orgânicos (`.organic-card`). Os cantos vivos foram restritos a tabelas técnicas.

**How to apply:** Follow roadmap in docs/roadmap.md. User can skip phases. Parallel subagents preferred (cap 5-6). Use .set()/.update() for Angular signals. InputSignal is read-only — use output() for child-to-parent. Sidebar is desktop-only, bottom nav for mobile. withComponentInputBinding() required for route param injection. Settings live inside Profile page — no separate /settings route. When using `[innerHTML]` for SVGs, wrap with `DomSanitizer.bypassSecurityTrustHtml()`.
