# JobHunter

> Automatize sua busca por emprego -- varredura, scoring e candidatura automatica em plataformas brasileiras.

[![Python 3.14](https://img.shields.io/badge/Python-3.14-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Angular 21](https://img.shields.io/badge/Angular-21-red?logo=angular&logoColor=white)](https://angular.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-green?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.60-2EAD33?logo=microsoftedge&logoColor=white)](https://playwright.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21-7929C5?logo=primeng&logoColor=white)](https://primeng.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Descricao

O **JobHunter** e uma ferramenta completa de automacao na busca por emprego no Brasil. Ele:

- **Varre** automaticamente vagas no LinkedIn, Gupy e Vagas.com
- **Pontua** cada vaga de 0 a 100% com base no seu perfil (cargo-alvo, palavras-chave, localizacao)
- **Candidata-se automaticamente** em vagas selecionadas (via Playwright)
- **Envia curriculos para empresas fixas** em intervalos configuraveis
- **Notifica** por email quando novas vagas sao encontradas
- **Gerencia tudo** por uma interface moderna com glassmorphism

**Custo total: $0/mes.** Backend na Oracle Cloud Always Free VM + Frontend no Firebase Hosting.

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 21, TypeScript 5.9, Tailwind CSS 3.4, PrimeNG 21 |
| Backend | Python 3.14, FastAPI 0.136, SQLAlchemy 2.0 (async), APScheduler |
| Database | SQLite (aiosqlite) |
| Scraping | Playwright 1.60, BeautifulSoup4, lxml |
| Testes | pytest 9, pytest-asyncio, Vitest |
| Deploy | Oracle Cloud Always Free VM (backend) + Firebase Hosting (frontend) |

---

## Features

- **Varredura automatica** -- Scrapers para LinkedIn, Gupy e Vagas.com com Playwright
- **Scoring inteligente** -- Algoritmo 0-100% baseado em cargo, keywords, localizacao e plataforma
- **Candidatura automatica** -- Applicators que preenchem formularios via Playwright
- **Empresas fixas** -- Gerencie empresas com envio recorrente (mensal configuravel)
- **Scheduler** -- APScheduler com varredura periodica e envios agendados
- **Notificacoes por email** -- Alertas SMTP para novas vagas e status de candidaturas
- **Dashboard completo** -- Metricas, graficos e visao geral em tempo real
- **Perfil do candidato** -- Configure cargo-alvo, keywords, localizacoes preferidas
- **Filtros e busca** -- Filtre por plataforma, score minimo, status e texto
- **Interface glassmorphism** -- Design moderno com Tailwind CSS, pill shapes e skeletons
- **Testes automatizados** -- 79 testes backend (pytest) + testes frontend (Vitest)

---

## Arquitetura

```
+------------------+        +------------------+        +------------------+
|                  | HTTP   |                  |  async  |                  |
|   Angular 21     | -----> |   FastAPI        | -----> |   SQLite         |
|   (SPA)          |        |   (Python 3.14)  |        |   (aiosqlite)    |
|                  | <----- |                  | <----- |                  |
+------------------+        +------------------+        +------------------+
       |                           |                           |
       |                    +------+------+                    |
       |                    |             |                    |
       |               +----+----+  +----+-----+              |
       |               | Scrapers|  |Scheduler  |              |
       |               | Playwright| |APScheduler|              |
       |               +----+----+  +----+-----+              |
       |                    |             |                    |
       |               +----v----+  +----v-----+              |
       |               |LinkedIn |  |Email      |              |
       |               |Gupy     |  |SMTP       |              |
       |               |Vagas.com|  +----------+              |
       |               +---------+                            |
       |                                                      |
  Firebase Hosting                              Oracle Cloud Always Free
```

---

## Quick Start

### Pre-requisitos

- Python 3.14+
- Node.js 20+
- uv (gerenciador de pacotes Python)
- npm 11+

### Backend

```bash
cd backend

# Instalar dependencias
uv sync

# Configurar variaveis de ambiente
cp .env.example .env
# Edite .env com suas configuracoes

# Rodar migrations e seed
python -m app.core.seed

# Iniciar o servidor
uvicorn app.main:app --reload
```

A API estara disponivel em `http://localhost:8000`

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar em modo dev
ng serve
```

O frontend estara disponivel em `http://localhost:4200`

### Verificando a saude da API

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## Estrutura de Pastas

```
curriculos/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Endpoints REST (jobs, applications, companies, profile, scheduler)
│   │   ├── core/             # Config, database, seed, schema (CamelCase)
│   │   ├── models/           # SQLAlchemy models + Pydantic schemas
│   │   ├── services/         # Logica de negocio
│   │   │   ├── automation/   # Applicators (Playwright para candidaturas)
│   │   │   └── scraper/      # Scrapers (Playwright para varredura)
│   │   └── main.py           # Entry point FastAPI
│   ├── tests/                # Testes automatizados (pytest)
│   ├── pyproject.toml        # Dependencias Python
│   ├── pytest.ini            # Config pytest
│   └── alembic.ini           # Config migrations
├── frontend/
│   └── src/
│       └── app/
│           ├── core/         # Models e services (API, jobs, applications, etc.)
│           ├── features/     # Componentes por pagina (dashboard, jobs, etc.)
│           ├── layout/       # Sidebar e topbar
│           └── shared/       # Componentes reutilizaveis (status-chip, skeleton, etc.)
├── docs/                     # Documentacao do projeto
│   ├── adr/                  # Architecture Decision Records
│   └── specs/                # Specifications detalhadas
├── ARCHITECTURE.md           # Visao geral da arquitetura
├── PRD.md                    # Product Requirements Document
└── PLAN.md                   # Plano de implementacao
```

---

## API Docs

A documentacao interativa da API esta disponivel em:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Endpoints Principais

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/jobs` | Listar vagas (com filtros e paginacao) |
| GET | `/api/v1/jobs/{id}` | Detalhes de uma vaga |
| POST | `/api/v1/jobs/scan` | Disparar varredura manual |
| GET | `/api/v1/applications` | Listar candidaturas |
| POST | `/api/v1/applications` | Criar candidatura |
| PUT | `/api/v1/applications/{id}/status` | Atualizar status da candidatura |
| GET | `/api/v1/companies` | Listar empresas fixas |
| POST | `/api/v1/companies` | Criar empresa fixa |
| GET | `/api/v1/profile` | Obter perfil do candidato |
| PUT | `/api/v1/profile` | Atualizar perfil |
| GET | `/api/v1/scheduler/status` | Status do scheduler |

Veja a documentacao completa em [`docs/specs/api-endpoints.md`](docs/specs/api-endpoints.md).

---

## Testes

### Backend

```bash
cd backend

# Rodar todos os testes
pytest

# Com cobertura
pytest --cov=app --cov-report=term-missing

# Rodar um modulo especifico
pytest tests/test_api_jobs.py -v
```

### Frontend

```bash
cd frontend

# Rodar todos os testes
ng test

# Modo watch
ng test --watch
```

---

## Deploy

### Backend -- Oracle Cloud Always Free VM

1. Crie uma instancia VM na Oracle Cloud (Always Free tier)
2. Instale Python 3.14 e uv na VM
3. Copie o codigo para a VM
4. Configure o `.env` com as credenciais de producao
5. Execute `uvicorn app.main:app --host 0.0.0.0 --port 8000`
6. Configure nginx como reverse proxy (HTTPS)

Veja detalhes em [`docs/specs/infrastructure.md`](docs/specs/infrastructure.md) e [`docs/adr/005-scaling-strategy.md`](docs/adr/005-scaling-strategy.md).

### Frontend -- Firebase Hosting

```bash
cd frontend

# Build para producao
ng build --configuration production

# Deploy para Firebase
firebase deploy --only hosting
```

---

## Custo

| Recurso | Custo |
|---------|-------|
| Oracle Cloud Always Free VM | $0/mes |
| Firebase Hosting (Spark plan) | $0/mes |
| SQLite (local na VM) | $0/mes |
| Playwright (open source) | $0/mes |
| **Total** | **$0/mes** |

---

## Roadmap Resumido

| Fase | Status | Descricao |
|------|--------|-----------|
| 1-2 | Concluido | Models, migrations, seed data, API real |
| 3-4 | Concluido | Scrapers LinkedIn/Gupy/Vagas, matcher 0-100% |
| 5 | Concluido | Applicators (auto-apply), scheduler, notificacoes |
| 6 | Em progresso | Frontend completo, UI glassmorphism |
| 7-8 | Planejado | Testes automatizados, CI/CD |
| 9-10 | Planejado | Deploy Oracle + Firebase |
| 11-12 | Planejado | Monitoramento, logging, refinamento |

Veja o roadmap completo em [`docs/roadmap.md`](docs/roadmap.md).

---

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudancas (`git commit -m 'feat: adicionar nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

Siga as convencoes do projeto:
- Commits em formato Conventional Commits
- Python: formate com `ruff`, type hints obrigatorios
- TypeScript: siga o estilo do projeto (Prettier configurado)
- Testes para todas as novas funcionalidades

---

## License

MIT License. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## Links Uteis

- [Guia do Desenvolvedor](docs/developer-guide.md)
- [Guia do Usuario](docs/user-guide.md)
- [Guide Tecnico](docs/technical-guide.md)
- [Especificacao da API](docs/specs/api-endpoints.md)
- [Modelos de Dados](docs/specs/data-models.md)
- [Componentes Frontend](docs/specs/frontend-components.md)
- [Scraping e Automacao](docs/specs/scraping-automation.md)
- [Infraestrutura](docs/specs/infrastructure.md)
- [Roadmap](docs/roadmap.md)
- [Architecture Decision Records](docs/adr/)
