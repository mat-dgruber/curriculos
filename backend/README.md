# JobHunter Backend

API REST para automacao de busca e candidatura a vagas de emprego. Scrape automatizado de
plataformas brasileiras (LinkedIn, Gupy, Vagas.com), scoring por compatibilidade com o perfil
do candidato, envio recorrente de curriculos para empresas fixas, e notificacoes por email.

---

## Stack

| Componente | Tecnologia |
|---|---|
| Runtime | Python 3.14 |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x (async) |
| Database | SQLite via aiosqlite |
| Migrations | Alembic |
| Validacao | Pydantic v2 + pydantic-settings |
| Agendamento | APScheduler (AsyncIO) |
| Browser Automation | Playwright |
| HTTP Client | httpx |
| Parsing | BeautifulSoup4 + lxml |
| Testes | pytest + pytest-asyncio |
| Deploy | Docker + Oracle Cloud Always Free |

---

## Pre-requisitos

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (gerenciador de pacotes)
- Playwright browsers instalados

---

## Configuracao

### 1. Instalar dependencias

```bash
cd backend
uv sync
```

### 2. Instalar navegadores do Playwright

```bash
uv run playwright install chromium
```

### 3. Criar arquivo `.env`

```bash
cp .env.example .env
```

Preencha as variaveis (veja [Variaveis de Ambiente](#variaveis-de-ambiente) abaixo).

### 4. Rodar migrations e seed

```bash
# As tabelas sao criadas automaticamente no startup (init_db)
# Para rodar seed dos dados iniciais:
uv run python -c "from app.core.seed import seed_all; import asyncio; asyncio.run(seed_all())"
```

### 5. Iniciar o servidor

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API fica disponivel em `http://localhost:8000` e a documentacao interativa em
`http://localhost:8000/docs`.

---

## Estrutura do Projeto

```
backend/
├── app/
│   ├── main.py                     # Entry point FastAPI, CORS, startup/shutdown
│   ├── core/
│   │   ├── config.py               # Settings via pydantic-settings (lida .env)
│   │   ├── database.py             # Engine async SQLAlchemy, session, init_db
│   │   ├── schema.py               # CamelModel — base Pydantic com alias camelCase
│   │   └── seed.py                 # Dados iniciais para desenvolvimento
│   ├── models/
│   │   ├── job.py                  # Job + schemas (Create, Read, Update, ListResponse)
│   │   ├── application.py          # Application + schemas
│   │   ├── company.py              # FixedCompany + schemas
│   │   └── profile.py              # CandidateProfile + schemas
│   ├── api/
│   │   └── routes/
│   │       ├── jobs.py             # Endpoints de vagas (CRUD + scan)
│   │       ├── applications.py     # Endpoints de candidaturas
│   │       ├── companies.py        # Endpoints de empresas fixas
│   │       ├── profile.py          # Endpoints de perfil + upload CV
│   │       └── scheduler.py        # Endpoints de status/controle do agendador
│   ├── services/
│   │   ├── scan_service.py         # Orquestra scrapers + matching + persistencia
│   │   ├── matcher.py              # Scoring de compatibilidade (0-100)
│   │   ├── scheduler_service.py    # APScheduler: jobs agendados + pause/resume
│   │   ├── recurring_service.py    # Envio recorrente para empresas fixas
│   │   ├── notification_service.py # Notificacoes por email (SMTP)
│   │   ├── scraper/
│   │   │   ├── base_scraper.py     # ScrapedJob dataclass + interface BaseScraper
│   │   │   ├── linkedin_scraper.py # Scraper LinkedIn (Playwright)
│   │   │   ├── gupy_scraper.py     # Scraper Gupy (Playwright)
│   │   │   └── vagas_scraper.py    # Scraper Vagas.com (Playwright)
│   │   └── automation/
│   │       ├── base_applicator.py  # Interface BaseApplicator + Result dataclass
│   │       ├── generic_applicator.py # Auto-apply generico (Playwright)
│   │       └── gupy_applicator.py  # Auto-apply especifico para Gupy
│   └── utils/
├── alembic/                        # Migrations Alembic
│   ├── env.py
│   └── versions/
├── tests/                          # Suite de testes (79 testes)
│   ├── conftest.py                 # Fixtures (client HTTP, database de teste)
│   ├── test_api_jobs.py
│   ├── test_api_applications.py
│   ├── test_api_companies.py
│   ├── test_api_profile.py
│   ├── test_api_scheduler.py
│   ├── test_models.py
│   ├── test_matcher.py
│   └── test_config.py
├── pyproject.toml                  # Dependencias e configuracao do projeto
├── pytest.ini                      # Configuracao pytest
├── alembic.ini                     # Configuracao Alembic
└── README.md                       # Este arquivo
```

---

## Endpoints da API

Todas as rotas estao sob o prefixo `/api/v1`.

### Jobs (Vagas)

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/v1/jobs` | Listar vagas (paginado, com filtros) |
| `POST` | `/api/v1/jobs` | Criar vaga manualmente |
| `GET` | `/api/v1/jobs/{id}` | Detalhe de uma vaga |
| `POST` | `/api/v1/jobs/scan` | Disparar varredura em background |

**Query params para `GET /jobs`:**
`search`, `min_score`, `platform`, `status`, `page`, `per_page`

### Applications (Candidaturas)

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/v1/applications` | Listar candidaturas (paginado) |
| `POST` | `/api/v1/applications` | Criar candidatura (vincula a um job) |
| `PUT` | `/api/v1/applications/{id}/status` | Atualizar status |

**Query params para `GET /applications`:**
`status`, `date_from`, `date_to`, `page`, `per_page`

**Transicoes de status validas:**
- Pendente -> Enviado, Falhou, Arquivado
- Enviado -> Arquivado
- Falhou -> Pendente, Arquivado

### Companies (Empresas Fixas)

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/v1/companies` | Listar empresas fixas |
| `POST` | `/api/v1/companies` | Criar empresa fixa |
| `PUT` | `/api/v1/companies/{id}` | Atualizar empresa |
| `DELETE` | `/api/v1/companies/{id}` | Remover empresa |
| `PUT` | `/api/v1/companies/{id}/toggle` | Ativar/desativar envio recorrente |

### Profile (Perfil do Candidato)

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/v1/profile` | Obter perfil |
| `PUT` | `/api/v1/profile` | Atualizar perfil |
| `POST` | `/api/v1/profile/cv` | Upload de curriculo (PDF) |

### Scheduler (Agendador)

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/api/v1/scheduler/status` | Status do agendador e jobs |
| `POST` | `/api/v1/scheduler/trigger/{job_id}` | Disparar job manualmente |
| `PUT` | `/api/v1/scheduler/pause` | Pausar agendador |
| `DELETE` | `/api/v1/scheduler/pause` | Retomar agendador |

**Jobs disponiveis para trigger:** `scan_jobs`, `recurring_send`

### Health Check

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/health` | Verificacao de saude do servico |

---

## Modelos de Dados

### Job (Vaga)

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `str` (UUID) | Identificador unico |
| `title` | `str` | Titulo da vaga |
| `company` | `str` | Nome da empresa |
| `location` | `str` | Localizacao |
| `platform` | `str` | Plataforma de origem (`linkedin`, `gupy`, `vagas`) |
| `url` | `str` | Link da vaga |
| `description` | `str?` | Descricao da vaga |
| `requirements` | `str?` | Requisitos |
| `salary_range` | `str?` | Faixa salarial |
| `score` | `int` | Score de compatibilidade (0-100) |
| `status` | `str` | Status (`Nova`, `Visualizada`, `Candidatou`) |
| `found_at` | `datetime` | Data que a vaga foi encontrada |
| `created_at` | `datetime` | Data de criacao no sistema |
| `updated_at` | `datetime` | Ultima atualizacao |

### Application (Candidatura)

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `str` (UUID) | Identificador unico |
| `job_id` | `str` | FK para a vaga |
| `company_name` | `str` | Nome da empresa |
| `status` | `str` | `Pendente`, `Enviado`, `Falhou`, `Arquivado` |
| `sent_at` | `datetime?` | Data/hora do envio |
| `is_recurring` | `bool` | Se e envio recorrente |
| `screenshot_path` | `str?` | Caminho do screenshot do envio |
| `error_message` | `str?` | Mensagem de erro (se falhou) |
| `notes` | `str?` | Notas do usuario |
| `fixed_company_id` | `str?` | FK para empresa fixa (se recorrente) |

### FixedCompany (Empresa Fixa)

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `str` (UUID) | Identificador unico |
| `name` | `str` | Nome da empresa |
| `application_url` | `str` | URL para candidatura |
| `status` | `str` | `Ativo`, `Pausado`, `Respondeu` |
| `is_active` | `bool` | Se o envio recorrente esta ativo |
| `interval_days` | `int` | Intervalo entre envios (7-90 dias) |
| `last_sent_at` | `datetime?` | Data do ultimo envio |
| `next_send_at` | `datetime?` | Data do proximo envio |
| `total_sent` | `int` | Total de envios realizados |
| `notes` | `str?` | Notas |

### CandidateProfile (Perfil do Candidato)

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `str` (UUID) | Identificador unico |
| `name` | `str` | Nome completo |
| `email` | `str` | Email |
| `phone` | `str?` | Telefone |
| `location` | `str?` | Localizacao desejada |
| `target_role` | `str?` | Cargo-alvo principal |
| `linkedin_url` | `str?` | URL do LinkedIn |
| `cv_filename` | `str?` | Nome do arquivo do CV |
| `cv_uploaded_at` | `datetime?` | Data do upload do CV |
| `keywords` | `list[str]` | Palavras-chave para matching |
| `target_roles` | `list[str]` | Cargos-alvo |
| `preferred_locations` | `list[str]` | Localizacoes preferidas |
| `scan_interval_hours` | `int` | Intervalo de varredura (1-24h) |
| `auto_apply` | `bool` | Se auto-apply esta habilitado |

**Nota:** Os campos `keywords`, `target_roles` e `preferred_locations` sao
armazenados como JSON no SQLite e convertidos para `list[str]` na API via
metodos auxiliares no modelo.

---

## Servicos

### ScanService (`scan_service.py`)
Orquestra todo o fluxo de varredura:
1. Le o perfil do candidato para extrair keywords, cargos-alvo e localizacoes
2. Executa os scrapers (Gupy, LinkedIn, Vagas) em sequencia com tratamento de erro
3. Passa os resultados pelo Matcher para scoring de compatibilidade
4. Deduplica por URL e persiste apenas vagas novas no banco

### Matcher (`matcher.py`)
Calcula score de compatibilidade (0-100) com a seguinte ponderacao:
- **40 pontos** — Cargo-alvo encontrado no titulo da vaga
- **30 pontos** — Keywords encontradas na descricao/titulo (6 por keyword, max 5)
- **20 pontos** — Localizacao compativel
- **10 pontos** — Bonus por plataforma confiavel (LinkedIn, Gupy)

### SchedulerService (`scheduler_service.py`)
Gerencia o APScheduler com dois jobs:
- **scan_jobs** — Varredura periodica a cada N horas (configuravel)
- **recurring_send** — Envio recorrente no dia do mes (padrao: dia 1, 10h)

Suporta pause/resume com tracking de status de cada job.

### RecurringService (`recurring_service.py`)
Envia curriculos automaticamente para empresas fixas ativas que estao com
`next_send_at` vencido. Seleciona o applicator correto (Gupy ou Generic)
baseado na URL da empresa.

### NotificationService (`notification_service.py`)
Envia emails de notificacao via SMTP (TLS):
- Novas vagas encontradas (resumo por plataforma)
- Candidatura enviada com sucesso
- Falha no envio de candidatura
- Resultado de envio recorrente

### Scrapers (`scraper/`)
Modulo de scraping com Playwright (headless Chromium):
- **LinkedInScraper** — Vagas do LinkedIn
- **GupyScraper** — Vagas da Gupy
- **VagasScraper** — Vagas do Vagas.com

Todos implementam a interface `BaseScraper` com o metodo `scrape()`.

### Automation (`automation/`)
Modulo de auto-apply com Playwright:
- **GenericApplicator** — Preenche formularios genericos de candidatura
- **GupyApplicator** — Auto-apply especifico para a plataforma Gupy

---

## Variaveis de Ambiente

Crie o arquivo `.env` na raiz do `backend/` com as seguintes variaveis:

| Variavel | Padrao | Descricao |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./jobhunter.db` | URL de conexao do banco |
| `ENVIRONMENT` | `development` | Ambiente (`development` / `production`) |
| `FRONTEND_URL` | `http://localhost:4200` | URL do frontend (CORS) |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | Chave secreta |
| `CV_STORAGE_PATH` | `./storage/cv` | Diretorio de armazenamento de CVs |
| `SCREENSHOTS_PATH` | `./storage/screenshots` | Diretorio de screenshots de envio |
| `SCAN_INTERVAL_HOURS` | `6` | Intervalo entre varreduras (horas) |
| `RECURRING_SEND_DAY` | `1` | Dia do mes para envio recorrente |
| `PLAYWRIGHT_HEADLESS` | `true` | Rodar Playwright em modo headless |
| `PLAYWRIGHT_SLOW_MO` | `100` | Delay entre acoes do Playwright (ms) |
| `SMTP_HOST` | `smtp.gmail.com` | Host do servidor SMTP |
| `SMTP_PORT` | `587` | Porta do SMTP |
| `SMTP_USER` | _(vazio)_ | Usuario SMTP |
| `SMTP_PASSWORD` | _(vazio)_ | Senha SMTP |
| `NOTIFICATION_EMAIL` | _(vazio)_ | Email para receber notificacoes |

**Exemplo minimo de `.env`:**

```env
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
NOTIFICATION_EMAIL=seu-email@gmail.com
SCAN_INTERVAL_HOURS=6
```

---

## Executando Testes

```bash
cd backend

# Rodar todos os testes
uv run pytest

# Com verbosidade
uv run pytest -v

# Rodar testes de um arquivo especifico
uv run pytest tests/test_api_jobs.py -v

# Com cobertura (requer pytest-cov)
uv run pytest --cov=app --cov-report=term-missing
```

A suite possui 79 testes cobrindo:

| Arquivo | Cobre |
|---|---|
| `test_api_jobs.py` | Endpoints de vagas (listagem, criacao, detalhe, scan) |
| `test_api_applications.py` | Endpoints de candidaturas (CRUD + transicoes de status) |
| `test_api_companies.py` | Endpoints de empresas fixas (CRUD + toggle) |
| `test_api_profile.py` | Endpoints de perfil (GET, PUT, upload CV) |
| `test_api_scheduler.py` | Endpoints do agendador (status, trigger, pause/resume) |
| `test_models.py` | Modelos SQLAlchemy + schemas Pydantic |
| `test_matcher.py` | Logica de scoring de compatibilidade |
| `test_config.py` | Configuracao e variaveis de ambiente |

Os testes usam SQLite em memoria para isolamento, com fixtures para engine,
sessao e client HTTP (via `httpx.AsyncClient` + `ASGITransport`).

---

## Deploy com Docker

### Build da imagem

```bash
cd backend
docker build -t jobhunter-backend .
```

### Rodar o container

```bash
docker run -d \
  --name jobhunter-api \
  -p 8000:8000 \
  --env-file .env \
  -v jobhunter-data:/app/data \
  -v jobhunter-cv:/app/storage/cv \
  -v jobhunter-screenshots:/app/storage/screenshots \
  jobhunter-backend
```

### Com docker-compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - jobhunter-data:/app/data
      - jobhunter-cv:/app/storage/cv
      - jobhunter-screenshots:/app/storage/screenshots
    restart: unless-stopped

volumes:
  jobhunter-data:
  jobhunter-cv:
  jobhunter-screenshots:
```

```bash
docker compose up -d
```

### Oracle Cloud Always Free

O deploy em producao roda em uma VM Oracle Cloud Always Free (ARM64, 4 OCPUs,
24GB RAM). O container e mantido com `restart: unless-stopped` e exposto
via nginx reverso com HTTPS (Let's Encrypt).

---

## Licenciamento

Projeto privado — JobHunter.
