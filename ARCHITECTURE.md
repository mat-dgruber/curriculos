# ARCHITECTURE.md — JobHunter

## 1. Tech Stack

### Frontend
| Tecnologia | Versão | Motivo |
|---|---|---|
| Angular | 21+ | Stack padrão do projeto, standalone components, signals |
| Tailwind CSS | 3.4.17 | Utility-first, mobile-first, design system via tokens |
| TypeScript | strict mode | Type safety obrigatório |
| PrimeNG | 21+ | Tabelas, badges de status, toasts — componentes complexos prontos |

### Backend
| Tecnologia | Versão | Motivo |
|---|---|---|
| Python | 3.14+ | Stack padrão, ecossistema de scraping/automação |
| FastAPI | latest | REST API leve, async nativo, Pydantic integrado |
| uv | latest | Gerenciador de pacotes rápido — substitui pip/poetry |
| Playwright | latest | Automação de browser headless para envio de formulários |
| APScheduler | latest | Agendamento de jobs (varredura + envios recorrentes) |
| SQLite | - | SQLite no dev E produção (VM Oracle Cloud). PostgreSQL via Supabase Free apenas se precisar escalar para multi-user no futuro |
| SQLAlchemy | 2.x | ORM com suporte async |

### Infraestrutura
| Tecnologia | Motivo |
|---|---|
| Firebase Hosting | Frontend Angular estático — CDN global, HTTPS grátis, deploy com 1 comando |
| Oracle Cloud Always Free (VM ARM) | Backend FastAPI + Playwright + APScheduler — VM ARM Always Free (até 4 OCPU, 24GB RAM, 200GB SSD), não expira nunca |
| SQLite (produção) | Banco de dados local na VM — zero latência, zero custo, suficiente para single-user |
| Supabase Free (opcional) | PostgreSQL managed 500MB — usar apenas se precisar de PostgreSQL no futuro |
| SMTP (Gmail ou Resend) | Notificações por e-mail |

---

## 2. Folder Structure

```
jobhunter/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   ├── api.service.ts          # HTTP client base (interceptors, base URL)
│   │   │   │   │   ├── jobs.service.ts         # Vagas: listar, filtrar, atualizar status
│   │   │   │   │   ├── applications.service.ts # Histórico de candidaturas
│   │   │   │   │   ├── profile.service.ts      # Perfil do candidato e upload de CV
│   │   │   │   │   └── companies.service.ts    # Empresas fixas (recorrentes)
│   │   │   │   └── models/
│   │   │   │       ├── job.model.ts            # Interface Job (vaga)
│   │   │   │       ├── application.model.ts    # Interface Application (candidatura)
│   │   │   │       ├── profile.model.ts        # Interface CandidateProfile
│   │   │   │       └── company.model.ts        # Interface FixedCompany
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.component.ts  # Painel principal: stats + vagas recentes
│   │   │   │   │   └── dashboard.component.html
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── jobs-list/
│   │   │   │   │   │   ├── jobs-list.component.ts   # Tabela de vagas com score e filtros
│   │   │   │   │   │   └── jobs-list.component.html
│   │   │   │   │   └── job-detail/
│   │   │   │   │       ├── job-detail.component.ts  # Detalhe da vaga + ação de candidatura
│   │   │   │   │       └── job-detail.component.html
│   │   │   │   ├── applications/
│   │   │   │   │   ├── applications.component.ts    # Histórico completo de envios
│   │   │   │   │   └── applications.component.html
│   │   │   │   ├── companies/
│   │   │   │   │   ├── companies.component.ts       # Gerenciar empresas fixas recorrentes
│   │   │   │   │   └── companies.component.html
│   │   │   │   ├── profile/
│   │   │   │   │   ├── profile.component.ts         # Formulário do perfil + upload do PDF
│   │   │   │   │   └── profile.component.html
│   │   │   │   └── settings/
│   │   │   │       ├── settings.component.ts        # Config: áreas de interesse, palavras-chave
│   │   │   │       └── settings.component.html
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   │   ├── score-badge/                 # Badge colorido com score de compatibilidade
│   │   │   │   │   ├── status-chip/                 # Chip de status da candidatura
│   │   │   │   │   ├── stat-card/                   # Card de métrica (total vagas, enviados, etc.)
│   │   │   │   │   └── empty-state/                 # Componente de estado vazio
│   │   │   │   └── pipes/
│   │   │   │       └── relative-time.pipe.ts        # "há 2 horas", "há 3 dias"
│   │   │   ├── layout/
│   │   │   │   ├── sidebar/
│   │   │   │   │   ├── sidebar.component.ts         # Navegação lateral (app shell)
│   │   │   │   │   └── sidebar.component.html
│   │   │   │   └── topbar/
│   │   │   │       ├── topbar.component.ts          # Barra superior com status do robô
│   │   │   │       └── topbar.component.html
│   │   │   ├── app.component.ts                     # Root component
│   │   │   ├── app.config.ts                        # provideRouter, provideHttpClient, etc.
│   │   │   └── app.routes.ts                        # Rotas da aplicação
│   │   ├── assets/
│   │   │   └── icons/                               # SVG icons customizados
│   │   ├── styles.css                               # Global styles + Tailwind @layer
│   │   └── index.html
│   ├── tailwind.config.js                           # Tokens de design (cores, fontes)
│   └── angular.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                                  # FastAPI app, CORS, routers
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── jobs.py                          # GET /jobs, POST /jobs/scan
│   │   │       ├── applications.py                  # GET /applications, POST /applications
│   │   │       ├── companies.py                     # CRUD de empresas fixas
│   │   │       ├── profile.py                       # GET/PUT perfil + upload CV PDF
│   │   │       └── scheduler.py                     # GET /scheduler/status, POST /scheduler/trigger
│   │   ├── core/
│   │   │   ├── config.py                            # Settings via pydantic-settings
│   │   │   ├── database.py                          # SQLAlchemy engine + session
│   │   │   └── deps.py                              # get_db, get_settings (injeção)
│   │   ├── models/
│   │   │   ├── job.py                               # SQLAlchemy model + Pydantic schema
│   │   │   ├── application.py                       # Modelo de candidatura
│   │   │   ├── company.py                           # Modelo de empresa fixa
│   │   │   └── profile.py                           # Modelo de perfil do candidato
│   │   ├── services/
│   │   │   ├── scraper/
│   │   │   │   ├── base_scraper.py                  # Classe base para todos os scrapers
│   │   │   │   ├── linkedin_scraper.py              # Scraper do LinkedIn Jobs
│   │   │   │   ├── gupy_scraper.py                  # Scraper do Gupy (API pública)
│   │   │   │   └── vagas_scraper.py                 # Scraper do Vagas.com
│   │   │   ├── automation/
│   │   │   │   ├── base_applicator.py               # Classe base para aplicação automática
│   │   │   │   ├── gupy_applicator.py               # Playwright: preenche form no Gupy
│   │   │   │   └── generic_applicator.py            # Playwright: form genérico (empresas fixas)
│   │   │   ├── matcher.py                           # Score de compatibilidade vaga x perfil
│   │   │   ├── scheduler_service.py                 # APScheduler: define e gerencia jobs
│   │   │   └── notification_service.py              # Envio de e-mails (SMTP)
│   │   └── utils/
│   │       └── pdf_handler.py                       # Leitura e manipulação do CV em PDF
│   ├── pyproject.toml                               # uv project config + dependências
│   ├── uv.lock
│   └── .env
```

---

## 3. Data Flow

### 3.1 — Varredura de Vagas (Scraping)
```
APScheduler (cron)
  → scraper service (LinkedIn / Gupy / Vagas.com)
  → filtra por cargo/área/localização do perfil
  → matcher.py calcula score de compatibilidade
  → salva vagas novas no banco (status: "Nova")
  → notification_service.py envia e-mail se score ≥ threshold
  → Frontend polling / WebSocket exibe vagas em tempo real
```

### 3.2 — Envio Automático de Currículo
```
Usuário aprova vaga no painel (ou job automático dispara)
  → applications.py cria registro (status: "Pendente")
  → automation service escolhe o applicator correto
  → Playwright abre browser headless
  → Preenche formulário com dados do perfil
  → Anexa CV em PDF
  → Submete formulário
  → Captura screenshot como evidência
  → Atualiza status: "Enviado" ou "Falhou"
  → notification_service.py notifica o usuário
```

### 3.3 — Empresas Fixas (Recorrente Mensal)
```
APScheduler (cron mensal)
  → busca todas as FixedCompany com status "Ativo"
  → para cada empresa: verifica se já houve resposta
  → se não houve resposta: dispara generic_applicator
  → log salvo em applications com flag "recorrente: true"
  → e-mail de confirmação enviado ao candidato
```

### 3.4 — Upload do Currículo
```
Frontend: input file (PDF)
  → POST /profile/cv (multipart/form-data)
  → backend salva em /storage/cv/ com hash do arquivo
  → caminho salvo no perfil do candidato
  → pdf_handler.py extrai texto para uso no matcher
```

---

## 4. Component Map

| Componente | Localização | Responsabilidade |
|---|---|---|
| `DashboardComponent` | `features/dashboard` | Visão geral: stats, vagas recentes, status do agendador |
| `JobsListComponent` | `features/jobs/jobs-list` | Tabela paginada de vagas com filtros e score |
| `JobDetailComponent` | `features/jobs/job-detail` | Detalhe da vaga + botão de candidatura manual |
| `ApplicationsComponent` | `features/applications` | Histórico completo de todos os envios com status |
| `CompaniesComponent` | `features/companies` | CRUD de empresas fixas e configuração de recorrência |
| `ProfileComponent` | `features/profile` | Edição do perfil + upload do CV em PDF |
| `SettingsComponent` | `features/settings` | Palavras-chave, cargos alvo, frequência de varredura |
| `SidebarComponent` | `layout/sidebar` | Navegação principal do app (app shell) |
| `TopbarComponent` | `layout/topbar` | Status do robô (ativo/pausado), notificações, ações rápidas |
| `ScoreBadgeComponent` | `shared/components/score-badge` | Badge visual de compatibilidade (0–100%) |
| `StatusChipComponent` | `shared/components/status-chip` | Chip colorido de status da candidatura |
| `StatCardComponent` | `shared/components/stat-card` | Card reutilizável de métrica numérica |
| `EmptyStateComponent` | `shared/components/empty-state` | Estado vazio com ícone e CTA |

---

## 5. Environment Variables

### Backend (`.env`)
```env
# Banco de dados
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db  # SQLite no dev E produção (VM Oracle Cloud)

# E-mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASSWORD=app_password_aqui
NOTIFICATION_EMAIL=seu@gmail.com            # Para onde vão as notificações

# Aplicação
SECRET_KEY=chave_secreta_para_jwt_futuro
ENVIRONMENT=development                      # development | production
FRONTEND_URL=http://localhost:4200           # CORS origin do frontend

# Armazenamento
CV_STORAGE_PATH=./storage/cv                # Onde o PDF do currículo é salvo
SCREENSHOTS_PATH=./storage/screenshots      # Evidências dos envios automatizados

# Playwright
PLAYWRIGHT_HEADLESS=true                    # false para debug
PLAYWRIGHT_SLOW_MO=0                        # ms entre ações (aumentar se bloqueado)

# Scheduler
SCAN_INTERVAL_HOURS=6                       # Frequência da varredura de vagas
RECURRING_SEND_DAY=1                        # Dia do mês para envios recorrentes (1 = dia 1)
```

### Frontend (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};
```

---

## 6. Deployment

### Frontend
- **Plataforma:** Firebase Hosting
- **Build:** `ng build --configuration production`
- **Deploy:** `firebase deploy --only hosting`
- **CI:** GitHub Actions na branch `main`

### Backend
- **Plataforma:** Oracle Cloud Always Free — VM ARM (Ampere A1)
- **Por que não serverless:** Playwright e APScheduler precisam de processo de longa duração
- **Por que Oracle Cloud Free:** 2 VMs ARM Always Free (até 4 OCPU, 24GB RAM, 200GB SSD) — não expira nunca, diferente de trials temporários
- **Dockerfile:** Python 3.14 + Playwright browsers instalados
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Banco de dados:** SQLite local na VM (`./data/jobhunter.db`) — zero latência, zero custo, suficiente para single-user
- **Storage:** `./storage/cv/` e `./storage/screenshots/` como volumes Docker persistentes
- **Supabase Free (opcional):** PostgreSQL managed 500MB — usar apenas se precisar escalar para multi-user no futuro

### CI/CD
```
Push na branch main
  → GitHub Actions
  → roda testes (pytest)
  → build do frontend (ng build)
  → deploy no Firebase (frontend)
  → deploy na VM Oracle Cloud (backend via Dockerfile)
```
