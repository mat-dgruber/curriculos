# Guia Técnico — JobHunter

## Como o Sistema Funciona por Dentro

Este documento explica a arquitetura, fluxos de dados, comunicação entre componentes e decisões técnicas do JobHunter. É voltado para desenvolvedores que querem entender o sistema antes de implementar ou contribuir.

---

## 1. Visão Geral da Arquitetura

O JobHunter é composto por três camadas principais que se comunicam via REST API:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           JOBHUNTER                                      │
│                                                                          │
│  ┌──────────────────┐      HTTP/JSON      ┌──────────────────────────┐  │
│  │                  │  ◄────────────────► │                          │  │
│  │    FRONTEND      │     /api/v1/*       │        BACKEND           │  │
│  │                  │                      │                          │  │
│  │  Angular 21+     │    JSON responses    │  FastAPI (Python 3.14+)  │  │
│  │  Tailwind        │                      │  SQLAlchemy 2.x          │  │
│  │  PrimeNG         │                      │  APScheduler             │  │
│  │                  │                      │  Playwright              │  │
│  │  Firebase        │                      │                          │  │
│  │  Hosting         │                      │  Oracle Cloud Free       │  │
│  │  (estático)      │                      │  VM ARM (Docker)         │  │
│  └──────────────────┘                      └────────────┬─────────────┘  │
│                                                          │               │
│                          ┌───────────────────────────────┼────────────┐  │
│                          │                               │            │  │
│                          ▼                               ▼            │  │
│                 ┌──────────────┐              ┌─────────────────────┐│  │
│                 │    SQLite    │              │   EXTERNAL          ││  │
│                 │   (local)    │              │   SERVICES          ││  │
│                 │              │              │                     ││  │
│                 │  4 tabelas:  │              │  ┌───────────────┐  ││  │
│                 │  jobs        │              │  │ LinkedIn      │  ││  │
│                 │  applications│              │  │ Gupy API      │  ││  │
│                 │  companies   │              │  │ Vagas.com     │  ││  │
│                 │  profiles    │              │  └───────────────┘  ││  │
│                 │              │              │                     ││  │
│                 │  ./data/     │              │  ┌───────────────┐  ││  │
│                 │  jobhunter.db│              │  │ Playwright    │  ││  │
│                 └──────────────┘              │  │ (browser)     │  ││  │
│                                               │  └───────────────┘  ││  │
│                                               │                     ││  │
│                                               │  ┌───────────────┐  ││  │
│                                               │  │ SMTP (Gmail)  │  ││  │
│                                               │  └───────────────┘  ││  │
│                                               └─────────────────────┘│  │
│                                                                       │  │
└─────────────────────────────────────────────────────────────────────────┘

Infraestrutura:
  Frontend  → Firebase Hosting (Angular estático, CDN global, HTTPS grátis)
  Backend   → Oracle Cloud Always Free VM ARM (Docker, 2 OCPU, 8GB RAM)
  Banco     → SQLite local na VM (./data/jobhunter.db)
  Storage   → Filesystem local na VM (./storage/cv/ e ./storage/screenshots/)
  Custo     → $0/mês (tudo Always Free)
```

### Camadas

| Camada             | Tecnologia             | Responsabilidade                                      |
| ------------------ | ---------------------- | ----------------------------------------------------- |
| **Frontend**       | Angular 21+            | Interface do usuário, painel de controle, formulários |
| **Backend**        | FastAPI + Python 3.14+ | API REST, lógica de negócio, scraping, automação      |
| **Banco de dados** | SQLite (local na VM)   | Persistência de dados (vagas, candidaturas, perfil)   |
| **Automação**      | Playwright             | Browser headless para preenchimento de formulários    |
| **Agendamento**    | APScheduler            | Execução periódica de varreduras e envios             |
| **Notificações**   | SMTP (Gmail)           | E-mails automáticos ao usuário                        |

---

## 2. Stack Tecnológico

Cada tecnologia foi escolhida por um motivo específico. Aqui está o "porquê" de cada uma:

### Frontend

#### Angular 21+

**Por que Angular e não React/Vue/Next.js?**

Angular é a stack primária do desenvolvedor. A versão 21+ trouxe mudanças significativas que eliminam boilerplate:

- **Standalone Components**: sem mais NgModules. Cada componente declara suas próprias dependências via `imports` no decorator. Arquitetura mais simples e flat.
- **Signals**: substituem `BehaviorSubject` e `Subject` do RxJS para estado local. `signal()`, `computed()` e `effect()` são mais intuitivos e performáticos.
- **Nova sintaxe de control flow**: `@if`, `@for`, `@switch` substituem `*ngIf`, `*ngFor`, `*ngSwitch`. Sintaxe mais limpa, sem precisar de `ng-template`.
- **TypeScript strict mode**: `any` é proibido. Todas as interfaces são tipadas.

```typescript
// Exemplo de componente Angular 21+ no JobHunter
@Component({
  selector: "app-jobs-list",
  standalone: true,
  imports: [TableModule, ScoreBadgeComponent, StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./jobs-list.component.html",
})
export class JobsListComponent {
  // Signal-based inputs (não @Input())
  jobs = signal<Job[]>([]);
  loading = signal(false);

  // Signal-based state
  searchTerm = signal("");
  minScore = signal(0);

  // Computed signals
  filteredJobs = computed(() => {
    return this.jobs().filter(
      (j) =>
        j.title.toLowerCase().includes(this.searchTerm()) &&
        j.score >= this.minScore(),
    );
  });
}
```

#### Tailwind CSS 3.4.17

**Por que Tailwind e não Angular Material/Bootstrap?**

- **Utility-first**: classes como `bg-blue-500`, `text-lg`, `p-4` diretamente no HTML. Sem CSS para escrever.
- **Mobile-first**: classes responsivas por padrão (`md:grid-cols-3`, `lg:hidden`).
- **Design tokens**: cores, fontes e espaçamentos definidos em `tailwind.config.js`. Dark theme configurado uma vez.

```javascript
// tailwind.config.js — tokens de design do JobHunter
module.exports = {
  theme: {
    extend: {
      colors: {
        dark: "#0a0f1e", // Background principal
        primary: "#2563eb", // Azul primário
        accent: "#38bdf8", // Azul accent
        text: "#e2e8f0", // Texto principal
      },
    },
  },
};
```

#### PrimeNG 21+

**Por que PrimeNG e não outra lib de componentes?**

PrimeNG fornece componentes complexos prontos que seriam custosos de construir do zero:

- **Tabelas**: `p-table` com paginação, ordenação, filtros — usado em `JobsListComponent` e `ApplicationsComponent`
- **Badges e chips**: para scores e status
- **Toasts**: notificações in-app

Regra: PrimeNG só é usado quando um componente Angular customizado seria muito complexo. Para o resto, componentes customizados em `shared/components/`.

### Backend

#### FastAPI (Python 3.14+)

**Por que FastAPI e não Django/Flask/Express?**

- **Async nativo**: `async/await` em todas as rotas. Crucial para Playwright (operações de browser são I/O bound).
- **Pydantic integrado**: validação automática de request/response. Erros 422 gerados automaticamente.
- **OpenAPI automático**: Swagger UI gerado em `/docs` sem configuração.
- **Injeção de dependências**: `Depends()` para sessão de banco, configurações, etc.

```python
# Exemplo de rota FastAPI no JobHunter
@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    search: str = "",
    min_score: int = 0,
    platform: str = "",
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db)
):
    # Query construída com filtros
    query = select(Job)
    if search:
        query = query.where(Job.title.ilike(f"%{search}%"))
    if min_score > 0:
        query = query.where(Job.score >= min_score)
    if platform:
        query = query.where(Job.platform == platform)

    result = await db.execute(query.offset((page-1)*per_page).limit(per_page))
    return JobListResponse(items=result.scalars().all(), ...)
```

#### uv (Gerenciador de Pacotes)

**Por que uv e não pip/poetry?**

- **Velocidade**: 10-100x mais rápido que `pip install`
- **Determinístico**: `uv.lock` garante versões exatas em qualquer máquina
- **Modern**: `pyproject.toml` como fonte única de verdade

```bash
# Comandos uv no JobHunter
uv init jobhunter-backend       # Inicializa projeto
uv add fastapi sqlalchemy       # Adiciona dependências
uv sync                         # Instala tudo do lockfile
uv run uvicorn app.main:app     # Executa o servidor
```

#### SQLAlchemy 2.x

**Por que SQLAlchemy e não raw SQL ou outro ORM?**

- **Async nativo**: `AsyncSession` com `await`
- **Pydantic integration**: conversão automática via `from_attributes=True`
- **Alembic**: migrations versionadas, rollback suportado
- **Multi-banco**: mesmo código funciona com SQLite (dev/produção) e PostgreSQL (futuro, via Supabase)

#### Playwright

**Por que Playwright e não Selenium?**

- **API moderna**: `async/await` nativo, mais limpo que Selenium
- **Auto-wait**: espera elementos automaticamente antes de interagir
- **Screenshots nativos**: `page.screenshot()` em uma linha
- **Cross-browser**: Chromium, Firefox, WebKit com mesma API

```python
# Exemplo de Playwright no JobHunter
async def apply_to_job(page: Page, profile: CandidateProfile, cv_path: str):
    await page.goto("https://gupy.io/jobs/123")
    await page.click('[data-testid="apply-button"]')
    await asyncio.sleep(random.uniform(1, 3))  # Anti-bot delay

    await page.fill('[data-testid="input-name"]', profile.name)
    await asyncio.sleep(random.uniform(1, 3))

    await page.fill('[data-testid="input-email"]', profile.email)
    await asyncio.sleep(random.uniform(1, 3))

    await page.set_input_files('input[type="file"]', cv_path)
    await page.screenshot(path="./storage/screenshots/before_submit.png")

    await page.click('button[type="submit"]')
    await page.wait_for_load_state("networkidle")
    await page.screenshot(path="./storage/screenshots/after_submit.png")
```

#### APScheduler

**Por que APScheduler e não Celery?**

- **Sem broker externo**: não precisa de Redis ou RabbitMQ
- **Mesmo processo**: roda dentro do FastAPI, simplifica deploy
- **Persistência**: jobs sobrevivem a restarts via SQLAlchemy jobstore
- **Suficiente para MVP**: para uso pessoal, Celery seria overkill

---

## 3. Modelos de Dados

O banco de dados possui 4 tabelas principais. Aqui está cada uma com seus campos, relacionamentos e regras de negócio.

### Diagrama de Relacionamentos

```
┌─────────────────┐         ┌───────────────────┐         ┌─────────────────┐
│      JOB         │         │   APPLICATION      │         │  FIXED_COMPANY   │
│─────────────────│         │───────────────────│         │─────────────────│
│ id (UUID, PK)    │◄────────│ job_id (FK)        │         │ id (UUID, PK)    │
│ title             │         │ company_name       │         │ name              │
│ company           │         │ status             │         │ application_url   │
│ location          │         │ is_recurring       │         │ status            │
│ platform          │         │ screenshot_path    │         │ is_active          │
│ url               │         │ error_message      │         │ interval_days      │
│ description       │         │ sent_at            │         │ last_sent_at       │
│ score (0-100)     │         │ notes              │         │ next_send_at       │
│ status            │         │                    │         │ total_sent         │
│ found_at          │         │ fixed_company_id ──┼────────►│ notes              │
│                   │         │ (FK, nullable)     │         │                    │
└─────────────────┘         └───────────────────┘         └─────────────────┘

                              ┌───────────────────┐
                              │ CANDIDATE_PROFILE  │
                              │───────────────────│
                              │ id (UUID, PK)      │
                              │ name               │
                              │ email              │
                              │ phone              │
                              │ location           │
                              │ target_role        │
                              │ linkedin_url       │
                              │ cv_filename        │
                              │ keywords (JSON)    │
                              │ target_roles (JSON)│
                              │ preferred_loc (JSON│
                              │ scan_interval_hours│
                              │ auto_apply         │
                              │                    │
                              │ ⚠️ SINGLETON       │
                              │ (1 registro só)    │
                              └───────────────────┘
```

### Tabela: Job (Vaga)

Representa uma vaga encontrada pelos scrapers.

| Campo          | Tipo         | Descrição                                                |
| -------------- | ------------ | -------------------------------------------------------- |
| `id`           | UUID         | Identificador único                                      |
| `title`        | String(255)  | Título da vaga (ex: "Desenvolvedor Angular Sênior")      |
| `company`      | String(255)  | Nome da empresa                                          |
| `location`     | String(255)  | Localização (ex: "São Paulo, SP (Remoto)")               |
| `platform`     | String(50)   | Origem: `linkedin`, `gupy` ou `vagas`                    |
| `url`          | String(1024) | Link direto para a vaga original                         |
| `description`  | Text         | Descrição completa da vaga                               |
| `requirements` | Text         | Requisitos em JSON (ex: `["Angular 15+", "TypeScript"]`) |
| `salary_range` | String(100)  | Faixa salarial quando disponível                         |
| `score`        | Integer      | Score de compatibilidade (0-100%)                        |
| `status`       | String(20)   | `Nova`, `Visualizada` ou `Candidatou`                    |
| `found_at`     | DateTime     | Quando a vaga foi encontrada                             |

**Status válidos:**

- `Nova` — vaga recém-encontrada pelo scraper
- `Visualizada` — usuário abriu os detalhes
- `Candidatou` — usuário ou sistema enviou candidatura

### Tabela: Application (Candidatura)

Representa uma candidatura enviada (manual ou automática).

| Campo              | Tipo        | Descrição                                       |
| ------------------ | ----------- | ----------------------------------------------- |
| `id`               | UUID        | Identificador único                             |
| `job_id`           | UUID (FK)   | Referência à vaga                               |
| `company_name`     | String(255) | Nome da empresa (desnormalizado para histórico) |
| `status`           | String(20)  | `Pendente`, `Enviado`, `Falhou` ou `Arquivado`  |
| `is_recurring`     | Boolean     | `true` se foi envio recorrente mensal           |
| `screenshot_path`  | String(512) | Caminho do screenshot de evidência              |
| `error_message`    | Text        | Mensagem de erro (quando falha)                 |
| `notes`            | Text        | Notas do usuário                                |
| `sent_at`          | DateTime    | Quando o envio foi realizado                    |
| `fixed_company_id` | UUID (FK)   | Referência à empresa fixa (nullable)            |

**Fluxo de status (unidirecional):**

```
                    ┌───────────┐
                    │ Pendente  │
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌───────────┐
        │ Enviado  │ │  Falhou  │ │ Arquivado │
        └──────────┘ └────┬─────┘ └───────────┘
                          │
                    (retry manual)
                          │
                          ▼
                    ┌───────────┐
                    │ Pendente  │
                    └───────────┘

Regra: Enviado NUNCA volta para Pendente
```

### Tabela: FixedCompany (Empresa Fixa)

Representa uma empresa cadastrada para envio recorrente mensal.

| Campo             | Tipo         | Descrição                            |
| ----------------- | ------------ | ------------------------------------ |
| `id`              | UUID         | Identificador único                  |
| `name`            | String(255)  | Nome da empresa (ex: "Banco XYZ")    |
| `application_url` | String(1024) | URL do formulário "Trabalhe Conosco" |
| `status`          | String(20)   | `Ativo`, `Pausado` ou `Respondeu`    |
| `is_active`       | Boolean      | Toggle para pausar/ativar            |
| `interval_days`   | Integer      | Dias entre envios (7-90, default 30) |
| `last_sent_at`    | DateTime     | Data do último envio                 |
| `next_send_at`    | DateTime     | Próximo envio agendado               |
| `total_sent`      | Integer      | Contador de envios realizados        |
| `notes`           | Text         | Notas sobre a empresa                |

**Fluxo de status:**

```
        ┌──────────┐
        │  Ativo   │◄──────────────┐
        └────┬─────┘               │
             │                     │
     (usuário pausa)      (usuário reativa)
             │                     │
             ▼                     │
        ┌──────────┐               │
        │ Pausado  │───────────────┘
        └──────────┘

        Qualquer ──────────► ┌───────────┐
        estado               │ Respondeu │ (FINAL)
                             └───────────┘
        (empresa respondeu ao candidato)
```

**Regra crítica:** Quando `status = "Respondeu"`, o sistema PARA automaticamente os envios recorrentes. Nunca mais envia para essa empresa.

### Tabela: CandidateProfile (Perfil do Candidato)

Singleton — existe apenas **um registro** no sistema (uso pessoal).

| Campo                 | Tipo        | Descrição                                                   |
| --------------------- | ----------- | ----------------------------------------------------------- |
| `id`                  | UUID        | Identificador único                                         |
| `name`                | String(255) | Nome completo                                               |
| `email`               | String(255) | E-mail de contato                                           |
| `phone`               | String(20)  | Telefone                                                    |
| `location`            | String(255) | Cidade/estado                                               |
| `target_role`         | String(255) | Cargo alvo (ex: "Desenvolvedor Angular/Python")             |
| `linkedin_url`        | String(512) | Perfil do LinkedIn                                          |
| `cv_filename`         | String(255) | Nome do arquivo PDF                                         |
| `keywords`            | Text (JSON) | Palavras-chave de busca (ex: `["angular", "python"]`)       |
| `target_roles`        | Text (JSON) | Cargos alvo (ex: `["Frontend", "Full Stack"]`)              |
| `preferred_locations` | Text (JSON) | Localizações preferidas (ex: `["São Paulo", "Remoto"]`)     |
| `scan_interval_hours` | Integer     | Frequência de varredura (1-72h, default 6h)                 |
| `auto_apply`          | Boolean     | Se `true`, envia automaticamente para vagas com score ≥ 80% |

**Nota sobre JSON fields:** SQLite não suporta JSON nativo. Campos como `keywords` são armazenados como texto serializado (`json.dumps()`). Ao migrar para PostgreSQL, podem usar o tipo JSON nativo.

---

## 4. Comunicação Frontend ↔ Backend

### Protocolo

Toda comunicação acontece via **REST API** usando **HTTP/JSON**:

```
Frontend (Angular)                    Backend (FastAPI)
       │                                      │
       │  GET /api/v1/jobs?min_score=70       │
       │  Content-Type: application/json       │
       │─────────────────────────────────────►│
       │                                      │  Consulta banco
       │  200 OK                              │
       │  { "items": [...], "total": 42 }     │
       │◄─────────────────────────────────────│
       │                                      │
       │  POST /api/v1/applications           │
       │  { "job_id": "uuid" }                │
       │─────────────────────────────────────►│
       │                                      │  Cria registro
       │  201 Created                         │
       │  { "id": "uuid", "status": "Pendente"│
       │◄─────────────────────────────────────│
```

### Regras de Comunicação

1. **Frontend nunca chama `HttpClient` diretamente** — sempre via serviços em `core/services/`
2. **Backend valida tudo com Pydantic** — dados inválidos retornam 422 automaticamente
3. **CORS restrito** — apenas `http://localhost:4200` (dev) tem acesso
4. **Prefixo versionado** — todas as rotas começam com `/api/v1`
5. **Formato de erro padrão** — `{ "detail": "mensagem de erro" }`

### Todos os 18 Endpoints

#### Jobs (Vagas)

| Método | Rota                | Descrição                                                     | Status   |
| ------ | ------------------- | ------------------------------------------------------------- | -------- |
| `GET`  | `/api/v1/jobs`      | Lista vagas com filtros (search, min_score, platform, status) | 200      |
| `GET`  | `/api/v1/jobs/{id}` | Detalhe de uma vaga específica                                | 200, 404 |
| `POST` | `/api/v1/jobs/scan` | Dispara varredura manual (executa em background)              | 202, 409 |

#### Applications (Candidaturas)

| Método | Rota                               | Descrição                                                 | Status        |
| ------ | ---------------------------------- | --------------------------------------------------------- | ------------- |
| `GET`  | `/api/v1/applications`             | Lista candidaturas com filtros (status, data, recorrente) | 200           |
| `POST` | `/api/v1/applications`             | Cria nova candidatura                                     | 201, 404, 409 |
| `PUT`  | `/api/v1/applications/{id}/status` | Atualiza status da candidatura                            | 200, 404, 409 |

#### Companies (Empresas Fixas)

| Método   | Rota                            | Descrição                    | Status        |
| -------- | ------------------------------- | ---------------------------- | ------------- |
| `GET`    | `/api/v1/companies`             | Lista empresas fixas         | 200           |
| `POST`   | `/api/v1/companies`             | Cadastra nova empresa fixa   | 201, 422      |
| `PUT`    | `/api/v1/companies/{id}`        | Atualiza empresa             | 200, 404      |
| `DELETE` | `/api/v1/companies/{id}`        | Remove empresa               | 200, 404      |
| `PUT`    | `/api/v1/companies/{id}/toggle` | Pausa/ativa envio recorrente | 200, 404, 409 |

#### Profile (Perfil do Candidato)

| Método | Rota                 | Descrição                           | Status        |
| ------ | -------------------- | ----------------------------------- | ------------- |
| `GET`  | `/api/v1/profile`    | Obtém perfil do candidato           | 200, 404      |
| `PUT`  | `/api/v1/profile`    | Atualiza perfil                     | 200, 422      |
| `POST` | `/api/v1/profile/cv` | Upload do currículo PDF (multipart) | 200, 400, 413 |

#### Scheduler (Agendador)

| Método   | Rota                             | Descrição                 | Status        |
| -------- | -------------------------------- | ------------------------- | ------------- |
| `GET`    | `/api/v1/scheduler/status`       | Status dos jobs agendados | 200           |
| `POST`   | `/api/v1/scheduler/trigger/{id}` | Dispara job manualmente   | 202, 404, 409 |
| `PUT`    | `/api/v1/scheduler/pause`        | Pausa global do agendador | 200, 422      |
| `DELETE` | `/api/v1/scheduler/pause`        | Retoma o agendador        | 200           |

### Códigos de Status HTTP

| Código | Significado       | Quando usar                                   |
| ------ | ----------------- | --------------------------------------------- |
| `200`  | OK                | GET, PUT bem-sucedidos                        |
| `201`  | Created           | POST criou recurso                            |
| `202`  | Accepted          | Operação aceita em background (scan, trigger) |
| `400`  | Bad Request       | Request malformado                            |
| `404`  | Not Found         | Recurso não existe                            |
| `409`  | Conflict          | Duplicata ou transição de status inválida     |
| `413`  | Payload Too Large | Upload > 10MB                                 |
| `422`  | Unprocessable     | Validação Pydantic falhou                     |
| `500`  | Internal Error    | Erro não tratado no servidor                  |

---

## 5. Scraping — Como o Sistema Encontra Vagas

O scraping é o coração do JobHunter. Três scrapers independentes buscam vagas em plataformas diferentes, cada um com sua técnica.

### Fluxo Geral do Scraping

```
APScheduler (a cada 6h)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    SCAN_JOBS                                 │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  LinkedIn    │  │    Gupy      │  │   Vagas.com      │   │
│  │  Scraper     │  │   Scraper    │  │   Scraper        │   │
│  │              │  │              │  │                  │   │
│  │  Playwright  │  │  API HTTP    │  │  Playwright +    │   │
│  │  (sem login) │  │  (JSON)      │  │  BeautifulSoup   │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           ▼                                  │
│                   ┌──────────────┐                           │
│                   │   Matcher    │                           │
│                   │   Service    │                           │
│                   │              │                           │
│                   │  Calcula     │                           │
│                   │  score 0-100 │                           │
│                   └──────┬───────┘                           │
│                          │                                   │
│                          ▼                                   │
│                   ┌──────────────┐                           │
│                   │   Salva no   │                           │
│                   │   banco de   │                           │
│                   │   dados      │                           │
│                   └──────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### LinkedIn Scraper

**Método:** Playwright (browser headless, sem login)

**URL de busca:**

```
https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}&f_TPR=r604800
```

O parâmetro `f_TPR=r604800` filtra vagas dos últimos 7 dias.

**Dados extraídos por vaga:**

| Dado        | Seletor                         | Observação                    |
| ----------- | ------------------------------- | ----------------------------- |
| Título      | `[data-testid="job-title"]`     | Título da vaga                |
| Empresa     | `[data-testid="company-name"]`  | Nome da empresa               |
| Localização | `[data-testid="job-location"]`  | Cidade/estado                 |
| Descrição   | `.show-more-less-html__markup`  | Abre o card para ver completa |
| URL         | `a[href*="/jobs/view/"]`        | Link direto                   |
| Salário     | `.job-search-card__salary-info` | Muitas vezes vazio            |

**Fluxo de execução:**

1. Monta URL de busca com keywords do perfil
2. Navega até a página de resultados
3. Faz scroll para carregar vagas (LinkedIn usa lazy loading)
4. Para cada card: extrai dados, aplica filtros
5. Clica no card para abrir descrição completa
6. Salva `ScrapedJob` com `platform="linkedin"`
7. Pagina se houver próxima página (máx 5 páginas)

**Medidas anti-bot:**

- Delay aleatório 2-4s entre ações (maior que outras plataformas)
- User-Agent de browser real
- Máximo 3 buscas por execução
- Varia keywords entre execuções

**Limitações conhecidas:**

- LinkedIn pode bloquear IP após muitas requisições sem login
- Descrições completas podem não carregar sem login
- Rate limit estimado: ~100 requests/hora
- Seletores mudam frequentemente

### Gupy Scraper

**Método:** Requisição HTTP direta à API pública do Gupy

Este é o scraper mais estável porque usa API pública em vez de scraping HTML.

**Endpoint da API:**

```
GET https://api.gupy.io/api/job?search={keywords}&location={location}&page={page}
```

**Dados extraídos por vaga:**

| Dado        | Campo JSON                               | Observação                 |
| ----------- | ---------------------------------------- | -------------------------- |
| Título      | `job.name`                               | Título da vaga             |
| Empresa     | `job.company.name`                       | Nome da empresa            |
| Localização | `job.address.city` + `job.address.state` | Cidade/estado              |
| Descrição   | `job.description`                        | HTML → precisa limpar tags |
| URL         | `https://gupy.io/jobs/{job.id}`          | Link da vaga               |
| Salário     | `job.salary_range`                       | Quando disponível          |

**Fluxo de execução:**

1. Monta query params com keywords e localização do perfil
2. Faz GET na API pública (sem autenticação)
3. Parseia resposta JSON
4. Para cada vaga: extrai dados, aplica filtros
5. Pagina (API retorna `total_pages`)
6. Salva `ScrapedJob` com `platform="gupy"`

**Retry strategy:** 3 tentativas com backoff exponencial (2s, 4s, 8s)

**Medidas anti-bot:**

- Apenas 1 requisição a cada 3s
- Máximo 10 páginas por execução

**Limitações:**

- API pública pode ser descontinuada sem aviso
- Nem todas as vagas do Gupy estão na API pública
- Descrição em HTML precisa de limpeza

### Vagas.com Scraper

**Método:** Playwright + BeautifulSoup (renderiza página, depois parseia HTML)

**URL de busca:**

```
https://www.vagas.com.br/vagas-de-{keywords}?pagina={page}
```

**Dados extraídos por vaga:**

| Dado        | Seletor                | Observação      |
| ----------- | ---------------------- | --------------- |
| Título      | `.vaga__title a`       | Título da vaga  |
| Empresa     | `.vaga__empresa`       | Nome da empresa |
| Localização | `.vaga__localizacao`   | Cidade/estado   |
| Descrição   | `.vaga__descricao`     | Abre detalhe    |
| URL         | `.vaga__title a[href]` | Link da vaga    |
| Salário     | `.vaga__salario`       | Quando exibido  |

**Fluxo de execução:**

1. Playwright navega até a página de resultados
2. Obtém HTML após renderização
3. BeautifulSoup parseia o HTML
4. Para cada card: extrai dados, aplica filtros
5. Pagina (seletor `.paginacao__proxima`)
6. Salva `ScrapedJob` com `platform="vagas"`

**Medidas anti-bot:**

- Delay aleatório 2-4s entre páginas
- User-Agent real
- Máximo 3 páginas por execução
- Scroll gradual (não pula para o fim)

**Limitações:**

- Vagas.com usa Cloudflare — possível bloqueio de bots
- Estrutura HTML muda com frequência — seletores frágeis
- Pode exigir cookies de sessão para páginas avançadas

### Matcher Service — Algoritmo de Score

Após encontrar vagas, o `matcher.py` calcula a compatibilidade com o perfil do candidato:

```python
def calculate_score(job: Job, profile: CandidateProfile) -> int:
    score = 0

    # 1. Match de cargo (peso 40)
    #    Se o cargo alvo aparece no título da vaga
    if any(role.lower() in job.title.lower() for role in profile.target_roles):
        score += 40

    # 2. Match de keywords na descrição (peso 30)
    #    Cada keyword encontrada vale 6 pontos (máx 5 keywords = 30)
    description_lower = job.description.lower()
    keyword_matches = sum(1 for kw in profile.keywords if kw.lower() in description_lower)
    keyword_score = min(30, keyword_matches * 6)
    score += keyword_score

    # 3. Match de localização (peso 20)
    #    Se a localização preferida aparece na localização da vaga
    if any(loc.lower() in job.location.lower() for loc in profile.preferred_locations):
        score += 20

    # 4. Bônus plataforma confiável (peso 10)
    #    LinkedIn e Gupy ganham bônus por serem plataformas consolidadas
    if job.platform in ("linkedin", "gupy"):
        score += 10

    return min(100, score)  # Máximo 100
```

**Exemplo prático:**

```
Perfil do candidato:
  target_roles: ["Desenvolvedor Angular", "Full Stack"]
  keywords: ["angular", "typescript", "python"]
  preferred_locations: ["São Paulo", "Remoto"]

Vaga encontrada:
  title: "Desenvolvedor Angular Sênior"
  company: "Tech Corp"
  location: "São Paulo, SP (Remoto)"
  description: "Buscamos dev com experiência em Angular e TypeScript..."
  platform: "linkedin"

Cálculo:
  Cargo match:  "Desenvolvedor Angular" está no título    → +40
  Keywords:     "angular" (6) + "typescript" (6) = 12     → +12
  Localização:  "São Paulo" está na localização            → +20
  Plataforma:   linkedin                                   → +10
                                                  TOTAL    = 82%
```

---

## 6. Automação — Como o Sistema Envia Currículos

A automação é o que diferencia o JobHunter de um simples agregador de vagas. Dois applicators diferentes lidam com diferentes tipos de formulário.

### Fluxo Geral da Automação

```
Trigger: Usuário clica "Candidatar-se" OU auto_apply ativo
    │
    ▼
Application criada no banco (status: "Pendente")
    │
    ▼
Automation service identifica a plataforma:
    │
    ├──► Se é vaga do Gupy:
    │       └──► GupyApplicator
    │
    └──► Se é empresa fixa ou outro site:
            └──► GenericApplicator
    │
    ▼
Playwright abre browser headless
    │
    ▼
Preenche formulário campo por campo
    │
    ▼
Anexa currículo PDF
    │
    ▼
Screenshot ANTES de enviar
    │
    ▼
Clica em enviar/submit
    │
    ▼
Aguarda resposta
    │
    ▼
Screenshot DEPOIS de enviar
    │
    ▼
Atualiza status no banco:
    ├──► Sucesso → status = "Enviado"
    └──► Falha   → status = "Falhou" + error_message
```

### Gupy Applicator

**Plataforma:** Gupy (ATS usado por muitas empresas)

**Método:** Playwright preenche formulários do Gupy campo por campo

**Seletores usados (data-testid):**

| Campo     | Seletor                          | Dado do Perfil         |
| --------- | -------------------------------- | ---------------------- |
| Nome      | `[data-testid="input-name"]`     | `profile.name`         |
| E-mail    | `[data-testid="input-email"]`    | `profile.email`        |
| Telefone  | `[data-testid="input-phone"]`    | `profile.phone`        |
| LinkedIn  | `[data-testid="input-linkedin"]` | `profile.linkedin_url` |
| Cidade    | `[data-testid="input-city"]`     | `profile.location`     |
| Currículo | `input[type="file"]`             | PDF do currículo       |

**Fluxo detalhado:**

```
1. Navega para https://gupy.io/jobs/{job_id}
2. Aguarda carregamento completo da página
3. Clica em "Candidatar-se" ([data-testid="apply-button"])
4. Aguarda formulário aparecer
5. Preenche campos obrigatórios:
   ├── Nome     → profile.name
   ├── E-mail   → profile.email
   └── Telefone → profile.phone
6. Preenche campos opcionais:
   ├── LinkedIn → profile.linkedin_url
   └── Cidade   → profile.location
7. Anexa currículo PDF (input[type="file"])
8. Captura screenshot ANTES de enviar
9. Clica em "Enviar candidatura"
10. Aguarda mensagem de confirmação
11. Captura screenshot DEPOIS de enviar
12. Retorna ApplicationResult(success=True, status="Enviado")
```

**Tratamento de erros:**

| Erro                             | Ação                                        |
| -------------------------------- | ------------------------------------------- |
| Botão "Candidatar-se" não existe | Vaga fechada → status "Falhou"              |
| Formulário com campos extras     | Log campos extras + preenche os que conhece |
| Erro de validação no formulário  | Captura mensagem + screenshot + "Falhou"    |
| Upload falha                     | Retry 1x + "Falhou" se persistir            |
| Timeout após submit              | Screenshot + "Falhou" + log                 |

### Generic Applicator

**Plataforma:** Sites genéricos de "Trabalhe Conosco"

**Método:** Playwright com detecção heurística de campos

Este applicator é mais genérico — não conhece a estrutura específica de cada site. Em vez disso, tenta detectar campos por tipo, name ou placeholder.

**Mapeamento de campos (heurística):**

```python
FIELD_MAPPING = {
    "name": [
        'input[name*="nome"]',
        'input[placeholder*="nome"]',
        'input[name="name"]'
    ],
    "email": [
        'input[type="email"]',
        'input[name*="email"]'
    ],
    "phone": [
        'input[type="tel"]',
        'input[name*="phone"]',
        'input[name*="telefone"]'
    ],
    "cv": [
        'input[type="file"][accept*="pdf"]',
        'input[type="file"]'
    ],
    "message": [
        'textarea',
        'input[name*="mensagem"]',
        'input[name*="message"]'
    ],
    "linkedin": [
        'input[name*="linkedin"]',
        'input[placeholder*="linkedin"]'
    ],
}
```

**Fluxo detalhado:**

```
1. Navega até company.application_url
2. Aguarda carregamento completo
3. Tenta detectar campos do formulário via heurística
4. Para cada campo detectado:
   ├── "name"     → profile.name
   ├── "email"    → profile.email
   ├── "phone"    → profile.phone
   ├── "cv"       → upload do PDF
   ├── "message"  → carta de apresentação padrão
   └── "linkedin" → profile.linkedin_url
5. Screenshot ANTES de enviar
6. Detecta botão de submit:
   ├── button[type="submit"]
   ├── input[type="submit"]
   └── button com texto "Enviar" ou "Candidatar"
7. Clica em submit
8. Aguarda resposta
9. Screenshot DEPOIS
10. Retorna ApplicationResult
```

**Carta de apresentação padrão (gerada automaticamente):**

```
Prezado(a) recrutador(a),

Gostaria de me candidatar a oportunidades em sua empresa.
Possuo experiência em [target_role do perfil] e acredito que
minhas habilidades são compatíveis com as necessidades da organização.

Meu currículo em anexo contém mais detalhes sobre minha experiência
e formação.

Atenciosamente,
[nome do candidato]
```

### Comportamentos Comuns a TODOS os Applicators

Estas regras se aplicam tanto ao GupyApplicator quanto ao GenericApplicator:

| Regra                        | Descrição                                                                 |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Delay aleatório**          | 1-3s entre cada ação do Playwright (anti-bot)                             |
| **Screenshot obrigatório**   | Sempre tira screenshot ANTES e DEPOIS do envio                            |
| **Status sempre atualizado** | Nunca deixa candidatura sem status após execução                          |
| **TimeoutError**             | Log + status "Falhou"                                                     |
| **ElementNotFoundError**     | Log + screenshot + status "Falhou"                                        |
| **Captcha detectado**        | Log + screenshot + status "Falhou" — NUNCA tenta burlar                   |
| **Credenciais**              | NUNCA armazenadas — sistema age como usuário logado via sessão de browser |

---

## 7. Agendamento — Como o Sistema Funciona Sozinho

O APScheduler é responsável por executar tarefas automaticamente, sem intervenção do usuário.

### Configuração

O APScheduler roda **no mesmo processo** que o FastAPI. Isso simplifica o deploy — não precisa de worker separado.

```python
# scheduler_service.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()

# Job 1: Varredura de vagas (a cada 6 horas)
scheduler.add_job(
    scan_all_platforms,
    trigger=IntervalTrigger(hours=SCAN_INTERVAL_HOURS),
    id="scan_jobs",
    name="Varredura de vagas",
    replace_existing=True  # Evita duplicatas no restart
)

# Job 2: Envio recorrente (dia 1 de cada mês às 10h)
scheduler.add_job(
    send_recurring_applications,
    trigger=CronTrigger(day=RECURRING_SEND_DAY, hour=10),
    id="recurring_send",
    name="Envio recorrente empresas fixas",
    replace_existing=True
)
```

### Jobs Configurados

| Job              | Trigger                            | Ação                                        |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| `scan_jobs`      | A cada 6h (configurável)           | Executa LinkedIn, Gupy e Vagas.com scrapers |
| `recurring_send` | Dia 1 do mês às 10h (configurável) | Envia currículo para empresas fixas ativas  |

### Regras de Execução

**Job de varredura (`scan_jobs`):**

```
1. Verifica se agendador não está em pausa global
2. Executa LinkedInScraper, GupyScraper, VagasScraper em paralelo
3. Para cada vaga encontrada:
   a. Verifica se já existe no banco (deduplicação por URL)
   b. Calcula score via Matcher
   c. Salva no banco com status "Nova"
4. Se auto_apply ativo E score ≥ 80%:
   a. Cria Application (status "Pendente")
   b. Dispara automação
5. Envia e-mail de notificação
6. Registra log com timestamp e resultado
```

**Job de envio recorrente (`recurring_send`):**

```
1. Busca todas as FixedCompany onde:
   - is_active = True
   - status != "Respondeu"
   - next_send_at <= agora
2. Para cada empresa:
   a. Executa GenericApplicator
   b. Atualiza last_sent_at
   c. Calcula próximo next_send_at (+ interval_days)
   d. Incrementa total_sent
   e. Registra Application com is_recurring=True
3. Envia e-mail de confirmação
4. Registra log
```

### Pausa e Retomada

**Pausa global** (para férias, processos em andamento):

```
PUT /api/v1/scheduler/pause
{ "pause_until": "2025-02-01T00:00:00Z" }

→ Todos os jobs param até a data especificada
→ Retoma automaticamente quando a data chegar
→ Ou retome manualmente: DELETE /api/v1/scheduler/pause
```

**Pausa por empresa** (toggle individual):

```
PUT /api/v1/companies/{id}/toggle

→ Alterna is_active (True ↔ False)
→ Atualiza status (Ativo ↔ Pausado)
→ Bloqueado se status = "Respondeu"
```

### Idempotência

Quando o backend reinicia, o APScheduler verifica se jobs já existem antes de criar novos:

```python
if not scheduler.get_job("scan_jobs"):
    scheduler.add_job(...)
```

Isso evita jobs duplicados em caso de restart.

---

## 8. Notificações — Como o Usuário é Alertado

### Configuração SMTP

O sistema usa SMTP do Gmail para enviar e-mails:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASSWORD=app_password_aqui
NOTIFICATION_EMAIL=seu@gmail.com
```

**Nota:** É necessário gerar uma "App Password" no Gmail (não usar a senha normal).

### Quando o Sistema Envia E-mails

| Evento                        | Assunto do E-mail                  | Conteúdo                      |
| ----------------------------- | ---------------------------------- | ----------------------------- |
| Varredura encontrou vagas     | "X novas vagas compatíveis!"       | Lista das vagas com score     |
| Candidatura enviada (sucesso) | "Currículo enviado para [empresa]" | Detalhes da vaga + screenshot |
| Candidatura falhou            | "Falha ao enviar para [empresa]"   | Motivo do erro + instrução    |
| Envio recorrente realizado    | "Envio mensal: [empresa]"          | Confirmação + próximo envio   |

### Fluxo de Notificação

```
Qualquer evento (scan, apply, recurring)
    │
    ▼
notification_service.py
    │
    ├── Monta e-mail (assunto + corpo em HTML)
    ├── Conecta no SMTP (smtp.gmail.com:587)
    ├── Envia para NOTIFICATION_EMAIL
    └── Loga resultado (sucesso ou falha no envio)
```

---

## 9. Segurança e LGPD

### Dados Pessoais (LGPD)

O JobHunter lida com dados sensíveis (nome, e-mail, telefone, CPF, histórico profissional). A conformidade com a LGPD é garantida assim:

| Dado                       | Onde fica                                | Quem tem acesso  |
| -------------------------- | ---------------------------------------- | ---------------- |
| Dados do perfil            | Banco próprio (SQLite/PostgreSQL)        | Apenas o usuário |
| Currículo PDF              | Storage local (`./storage/cv/`)          | Apenas o backend |
| Screenshots                | Storage local (`./storage/screenshots/`) | Apenas o backend |
| Credenciais de plataformas | **NÃO são armazenadas**                  | Ninguém          |

**Regra fundamental:** Os dados do candidato vão APENAS para as plataformas de destino (LinkedIn, Gupy, sites de empresas). Nunca são compartilhados com terceiros.

### Segurança Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADAS DE SEGURANÇA                      │
│                                                              │
│  1. DADOS PESSOAIS                                           │
│     ├── Ficam no banco próprio (nunca em serviços externos)  │
│     ├── PDF servido via endpoint autenticado (nunca URL pública)
│     └── Logs de automação são append-only (nunca deletados)  │
│                                                              │
│  2. CREDENCIAIS                                              │
│     ├── NUNCA armazenadas no sistema                         │
│     ├── Playwright age como "usuário logado" via sessão      │
│     └── Login manual necessário apenas uma vez               │
│                                                              │
│  3. AUTOMAÇÃO                                                │
│     ├── Delay aleatório entre ações (anti-detecção)          │
│     ├── Screenshots como evidência de cada tentativa         │
│     ├── Captcha: log + "Falhou" (NUNCA tenta burlar)         │
│     └── Respeita robots.txt quando possível                  │
│                                                              │
│  4. REDE                                                     │
│     ├── CORS restrito ao origin do frontend                  │
│     ├── HTTPS na produção                                    │
│     └── API versionada (/api/v1) para backward compatibility │
│                                                              │
│  5. BANCO DE DADOS                                           │
│     ├── SQLite no dev (arquivo local, sem rede)              │
│     ├── PostgreSQL na produção (criptografia em trânsito)    │
│     └── CHECK constraints nos status válidos                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Captcha — Política de Não-Burla

Quando um site de vagas apresenta Captcha (Cloudflare, reCAPTCHA, etc.), o sistema:

1. **Detecta** a presença do Captcha
2. **Tira screenshot** como evidência
3. **Registra log** com detalhes
4. **Atualiza status** para "Falhou"
5. **NUNCA tenta burlar** — isso evita:
   - Violação de Termos de Serviço
   - Risco legal
   - Banimento de IP
   - Perda de reputação

---

## 10. Storage e Arquivos

### Estrutura de Diretórios

```
./storage/
├── cv/
│   └── a1b2c3d4e5f67890...hash...sha256...pdf
│       └── Nome do arquivo é o hash SHA-256 do conteúdo
│           Vantagens: evita conflitos de nome, permite deduplicação
│
└── screenshots/
    ├── gupy_success_20250115_140000.png        ← Envio Gupy OK
    ├── gupy_fail_20250115_150000.png           ← Envio Gupy falhou
    ├── linkedin_scan_20250115_100000.png       ← Varredura LinkedIn
    ├── generic_success_20250115_160000.png     ← Empresa fixa OK
    └── generic_fail_20250115_170000.png        ← Empresa fixa falhou
```

### Nomes de Arquivos

**Currículo PDF:** hash SHA-256 como nome

```
Original: curriculo_matheus.pdf
No disco: a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890.pdf

Vantagens:
  - Sem conflitos de nome (dois uploads diferentes geram hashes diferentes)
  - Deduplicação (mesmo conteúdo = mesmo arquivo)
  - Sem caracteres especiais no nome do arquivo
```

**Screenshots:** timestamp no nome

```
Formato: {plataforma}_{status}_{YYYYMMDD}_{HHMMSS}.png

Exemplos:
  gupy_success_20250115_140000.png
  linkedin_scan_20250115_100000.png
  generic_fail_20250115_170000.png
```

---

## 11. Deploy e Infraestrutura

### Frontend — Firebase Hosting

```
Angular build → arquivos estáticos → Firebase Hosting

Comandos:
  ng build --configuration production
  firebase deploy --only hosting

URL final: https://jobhunter.web.app
```

**Por que Firebase Hosting?**

- É o padrão que o desenvolvedor já usa
- CDN global com SSL gratuito
- Deploy simples via CLI

### Backend — Oracle Cloud Free (VM ARM)

```
Dockerfile → imagem Python 3.14 + Playwright → VM ARM Always Free

Por que VPS e não serverless?
  - Playwright precisa de processo persistente (browser headless)
  - APScheduler precisa de processo de longa duração
  - Serverless (Lambda, Cloud Functions) não suporta isso

Por que Oracle Cloud Free?
  - Always Free (não expira, é pra sempre)
  - 2 VMs ARM (Ampere A1): até 4 OCPU, 24GB RAM
  - 200GB de storage
  - 10TB de saída/mês
  - Custo: $0/mês
```

**Dockerfile:**

```dockerfile
FROM python:3.14-slim

# Instala Playwright browsers
RUN playwright install --with-deps chromium

# Copia código
COPY . /app
WORKDIR /app

# Instala dependências
RUN pip install uv && uv sync

# Expõe porta
EXPOSE 8000

# Inicia servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Deploy na VM Oracle Cloud:**

```bash
# 1. Criar conta em cloud.oracle.com (Always Free, precisa cartão mas não cobra)
# 2. Criar VM ARM (Ampere A1, Ubuntu 22.04, 2 OCPU, 8GB RAM, 50GB boot volume)
# 3. Conectar via SSH
ssh ubuntu@<IP_PUBLICO_DA_VM>

# 4. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# 5. Clonar repo e configurar
git clone https://github.com/seu-usuario/jobhunter.git
cd jobhunter/backend
cp .env.example .env
mkdir -p ./data ./storage/cv ./storage/screenshots

# 6. Build e run
docker build -t jobhunter-backend .
docker run -d --name jobhunter -p 8000:8000 \
  -v ./storage:/app/storage -v ./data:/app/data \
  --env-file .env --restart unless-stopped jobhunter-backend

# 7. Rodar migrations
docker exec jobhunter alembic upgrade head

# 8. Abrir porta 8000 no Security List do Oracle Cloud
```

### CI/CD — GitHub Actions

```
Push na branch main
    │
    ▼
GitHub Actions
    │
    ├── 1. Roda testes (pytest)
    ├── 2. Build do frontend (ng build)
    ├── 3. Deploy no Firebase Hosting (frontend)
    └── 4. Deploy na Oracle Cloud VM (backend via SSH + Docker)
```

**Deploy manual do backend (via SSH):**
```bash
ssh ubuntu@<IP_PUBLICO_DA_VM> "cd ~/jobhunter/backend && git pull && docker build -t jobhunter-backend . && docker restart jobhunter"
```

### Banco de Dados — SQLite em Produção

```
SQLite (dev)                  SQLite (produção — VM Oracle Cloud)
───────────────               ────────────────────────────────────
Arquivo local (dev)           Arquivo local na VM (./data/jobhunter.db)
Mesmo arquivo .db             Mesmo formato, mesma engine
Zero config                   Volume Docker persistente

Por que SQLite em produção (single-user)?
  - Sem servidor externo — menos ponto de falha
  - Zero latência de rede (arquivo local)
  - Para uso pessoal com baixa concorrência, é mais que suficiente
  - Se PostgreSQL for necessário no futuro, basta mudar DATABASE_URL
    (SQLAlchemy abstrai o banco, Alembic cuida das migrations)
```

---

## 12. Environment Variables

### Backend (`.env`)

```env
# ═══════════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════════
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db
# SQLite em dev e produção (Oracle Cloud VM)
# Se precisar PostgreSQL no futuro, basta trocar para:
# DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/jobhunter

# ═══════════════════════════════════════
# E-MAIL (SMTP)
# ═══════════════════════════════════════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASSWORD=app_password_aqui        # App Password do Gmail
NOTIFICATION_EMAIL=seu@gmail.com       # Para onde vão as notificações

# ═══════════════════════════════════════
# APLICAÇÃO
# ═══════════════════════════════════════
SECRET_KEY=chave_secreta_para_jwt_futuro
ENVIRONMENT=development                 # development | production
FRONTEND_URL=http://localhost:4200      # CORS origin do frontend

# ═══════════════════════════════════════
# ARMAZENAMENTO
# ═══════════════════════════════════════
CV_STORAGE_PATH=./storage/cv           # Onde o PDF é salvo
SCREENSHOTS_PATH=./storage/screenshots # Screenshots de evidência

# ═══════════════════════════════════════
# PLAYWRIGHT
# ═══════════════════════════════════════
PLAYWRIGHT_HEADLESS=true               # false para debug visual
PLAYWRIGHT_SLOW_MO=0                   # ms entre ações (aumentar se bloqueado)

# ═══════════════════════════════════════
# AGENDAMENTO
# ═══════════════════════════════════════
SCAN_INTERVAL_HOURS=6                  # Frequência da varredura
RECURRING_SEND_DAY=1                   # Dia do mês para envios recorrentes
```

### Frontend (`environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8000",
};
```

### Frontend (`environment.prod.ts`)

```typescript
export const environment = {
  production: true,
  apiUrl: "http://<IP_PUBLICO_DA_VM>:8000", // URL de produção (Oracle Cloud VM ARM)
};
```

---

## Resumo Executivo

| Aspecto          | Detalhe                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| **O que faz**    | Varre vagas, calcula compatibilidade e envia currículos automaticamente |
| **Para quem**    | Uso pessoal (single-user), com path para multi-user                     |
| **Frontend**     | Angular 21+ + Tailwind + PrimeNG                                        |
| **Backend**      | FastAPI + Python 3.14 + SQLAlchemy + Playwright                         |
| **Banco**        | SQLite (dev e produção — Oracle Cloud VM ARM)                           |
| **Scraping**     | LinkedIn (Playwright), Gupy (API), Vagas.com (Playwright+BS4)           |
| **Automação**    | Playwright preenche formulários e anexa PDF                             |
| **Agendamento**  | APScheduler: varredura a cada 6h, envio mensal dia 1                    |
| **Notificações** | SMTP (Gmail) para alertas de vagas e envios                             |
| **Segurança**    | LGPD compliant, credenciais não armazenadas, Captcha não burlado        |
| **Deploy**       | Firebase Hosting (frontend) + Oracle Cloud VM ARM (backend via Docker)   |
