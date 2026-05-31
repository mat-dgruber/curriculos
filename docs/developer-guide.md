# Guia do Desenvolvedor — JobHunter

Guia de onboarding para desenvolvedores que vão trabalhar no codebase do JobHunter.

---

## 1. Pré-requisitos

| Ferramenta | Versão | Instalação |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Angular CLI | latest | `npm install -g @angular/cli` |
| Python | 3.14+ | https://python.org |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Playwright | latest | `uv run playwright install` |
| Git | 2.x+ | https://git-scm.com |

---

## 2. Setup do Projeto

### Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/jobhunter.git
cd jobhunter
```

### Frontend

```bash
cd frontend
npm install
ng serve
# Acessar: http://localhost:4200
```

### Backend

```bash
cd backend

# Instalar dependências
uv sync

# Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações (ver seção 12)

# Instalar browsers do Playwright
uv run playwright install

# Criar tabelas no banco
uv run alembic upgrade head

# Rodar o servidor
uv run uvicorn app.main:app --reload
# Acessar: http://localhost:8000/docs (Swagger UI)
```

### Verificar que Tudo Funciona

- **Frontend:** http://localhost:4200 mostra o painel
- **Backend:** http://localhost:8000/docs mostra a documentação Swagger
- **Banco:** arquivo `jobhunter.db` criado automaticamente na pasta `backend/`

---

## 3. Estrutura do Projeto

```
jobhunter/
├── frontend/src/app/
│   ├── core/
│   │   ├── services/         # Serviços HTTP (api, jobs, applications, profile, companies)
│   │   └── models/           # Interfaces TypeScript (job, application, profile, company)
│   ├── features/
│   │   ├── dashboard/        # Painel principal
│   │   ├── jobs/             # Vagas (lista + detalhe)
│   │   ├── applications/     # Histórico de candidaturas
│   │   ├── companies/        # Empresas fixas
│   │   ├── profile/          # Perfil do candidato
│   │   └── settings/         # Configurações de busca
│   ├── shared/
│   │   ├── components/       # Componentes reutilizáveis (score-badge, status-chip, stat-card, empty-state)
│   │   └── pipes/            # Pipes (relative-time)
│   ├── layout/
│   │   ├── sidebar/          # Navegação lateral
│   │   └── topbar/           # Barra superior com status do robô
│   ├── app.component.ts      # Root component
│   ├── app.config.ts         # Providers (router, httpClient)
│   └── app.routes.ts         # Definição de rotas
│
├── backend/app/
│   ├── main.py               # FastAPI app, CORS, routers
│   ├── api/routes/
│   │   ├── jobs.py           # GET/POST /jobs, POST /jobs/scan
│   │   ├── applications.py   # GET/POST /applications, PUT /applications/{id}/status
│   │   ├── companies.py      # CRUD /companies, PUT /companies/{id}/toggle
│   │   ├── profile.py        # GET/PUT /profile, POST /profile/cv
│   │   └── scheduler.py      # GET /scheduler/status, POST/PUT/DELETE /scheduler
│   ├── core/
│   │   ├── config.py         # pydantic-settings (.env)
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   └── deps.py           # Dependency injection (get_db, get_settings)
│   ├── models/
│   │   ├── job.py            # SQLAlchemy model + Pydantic schema
│   │   ├── application.py    # SQLAlchemy model + Pydantic schema
│   │   ├── company.py        # SQLAlchemy model + Pydantic schema
│   │   └── profile.py        # SQLAlchemy model + Pydantic schema
│   ├── services/
│   │   ├── scraper/
│   │   │   ├── base_scraper.py       # Interface comum
│   │   │   ├── linkedin_scraper.py   # Playwright (vagas públicas)
│   │   │   ├── gupy_scraper.py       # API pública JSON
│   │   │   └── vagas_scraper.py      # Playwright + BeautifulSoup
│   │   ├── automation/
│   │   │   ├── base_applicator.py    # Interface comum
│   │   │   ├── gupy_applicator.py    # Playwright forms Gupy
│   │   │   └── generic_applicator.py # Forms genéricos
│   │   ├── matcher.py                # Score de compatibilidade
│   │   ├── scheduler_service.py      # APScheduler jobs
│   │   └── notification_service.py   # E-mails SMTP
│   └── utils/
│       └── pdf_handler.py    # Leitura/manipulação do CV PDF
```

---

## 4. Regras de Desenvolvimento

### Angular (Frontend)

| Regra | O que fazer | O que NÃO fazer |
|---|---|---|
| Componentes | Standalone components | NgModules |
| Estado | `signal()`, `computed()`, `effect()` | `RxJS Subject/BehaviorSubject` para estado local |
| Control flow | `@if`, `@for`, `@switch` | `*ngIf`, `*ngFor`, `*ngSwitch` |
| TypeScript | Strict mode | Usar `any` |
| Lógica | Em serviços (`core/services/`) | Dentro de componentes |
| Inputs | `input()` signal-based | `@Input()` decorator |
| Outputs | `output()` | `@Output()` / `EventEmitter` |
| Change detection | `OnPush` em todos | `Default` |
| Async | `async/await` | `.then()/.catch()` |

### Python (Backend)

| Regra | O que fazer | O que NÃO fazer |
|---|---|---|
| Validação | Modelos Pydantic | Dicts não tipados |
| Config | `pydantic-settings` lendo `.env` | Hardcode de valores |
| Rotas | `async/await` em todas | Funções síncronas com I/O |
| CORS | Apenas origin do frontend | Permitir `*` |
| Erros | Mensagens genéricas ao cliente | Expor stack trace |

### Scraping & Automação

| Regra | O que fazer | O que NÃO fazer |
|---|---|---|
| Herança | Estender `BaseScraper` / `BaseApplicator` | Criar scrapers/applicators avulsos |
| Delays | `random.uniform(1, 3)` entre ações | Cliques sem pausa |
| Screenshots | Após cada tentativa (sucesso ou falha) | Pular screenshots |
| Status | Atualizar no banco após execução | Deixar sem status |
| Credenciais | Nunca armazenar | Salvar senhas de plataformas |
| Erros | `TimeoutError` / `ElementNotFoundError` → log + "Falhou" | Deixar crashar silenciosamente |

### Design

| Regra | Valor |
|---|---|
| Background dark | `#0a0f1e` |
| Azul primário | `#2563eb` |
| Azul accent | `#38bdf8` |
| Texto | `#e2e8f0` |
| Fonte mínima corpo | 16px |
| Abordagem | Mobile-first |
| Contraste | WCAG AA |

---

## 5. Como Adicionar um Novo Scraper

### Passo 1: Criar o arquivo

```python
# backend/app/services/scraper/novaplataforma_scraper.py

import random
import asyncio
from app.services.scraper.base_scraper import BaseScraper, ScrapedJob

class NovaPlataformaScraper(BaseScraper):

    def _build_search_url(self, params: dict) -> str:
        keywords = params.get("keywords", "")
        location = params.get("location", "")
        return f"https://novaplataforma.com/vagas?q={keywords}&loc={location}"

    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        jobs = []
        url = self._build_search_url(search_params)

        try:
            await self._safe_goto(url)
            await self._random_delay(2, 4)

            # Extrair vagas da página
            cards = await self.page.query_selector_all(".vaga-card")

            for card in cards:
                try:
                    title = await card.query_selector(".titulo")
                    title_text = await title.inner_text() if title else "N/A"

                    company = await card.query_selector(".empresa")
                    company_text = await company.inner_text() if company else "N/A"

                    link = await card.query_selector("a[href]")
                    link_href = await link.get_attribute("href") if link else ""

                    jobs.append(ScrapedJob(
                        title=title_text,
                        company=company_text,
                        location=search_params.get("location", ""),
                        description="",
                        url=link_href,
                        platform="novaplataforma"
                    ))
                except Exception as e:
                    self.logger.warning(f"Erro ao extrair vaga: {e}")
                    continue

        except TimeoutError:
            self.logger.error(f"Timeout ao acessar {url}")
        except Exception as e:
            self.logger.error(f"Erro no scraping: {e}")

        return jobs
```

### Passo 2: Registrar no scheduler

```python
# backend/app/services/scheduler_service.py

from app.services.scraper.novaplataforma_scraper import NovaPlataformaScraper

# Adicionar ao array de scrapers
scrapers = [
    LinkedInScraper,
    GupyScraper,
    VagasScraper,
    NovaPlataformaScraper,  # ← adicionar aqui
]
```

### Passo 3: Testar

```bash
curl -X POST http://localhost:8000/api/v1/jobs/scan
```

### Passo 4: Documentar seletores

Sempre documentar no código qual seletor está sendo usado e por quê:

```python
# Seletor: ".vaga-card" — container principal de cada vaga
# Atualizado em: 2025-01-15
# Nota: seletor pode mudar, verificar periodicamente
```

---

## 6. Como Adicionar um Novo Applicator

### Passo 1: Criar o arquivo

```python
# backend/app/services/automation/novaplataforma_applicator.py

from app.services.automation.base_applicator import BaseApplicator, ApplicationResult

class NovaPlataformaApplicator(BaseApplicator):

    async def apply(self, job) -> ApplicationResult:
        try:
            # 1. Navegar para a vaga
            await self._safe_goto(job.url)
            await self._random_delay(2, 4)

            # 2. Clicar em "Candidatar-se"
            await self._safe_click('[data-testid="apply-button"]')

            # 3. Preencher formulário
            await self._fill_form({
                "nome": self.profile.name,
                "email": self.profile.email,
                "telefone": self.profile.phone,
            })

            # 4. Upload do currículo
            await self._upload_cv('input[type="file"]')

            # 5. Screenshot antes de enviar
            await self._take_screenshot("novaplataforma", success=True)

            # 6. Enviar
            await self._safe_click('[data-testid="submit-button"]')
            await self._wait_for_navigation()

            # 7. Screenshot de confirmação
            screenshot = await self._take_screenshot("novaplataforma_confirm", success=True)

            return ApplicationResult(
                success=True,
                status="Enviado",
                screenshot_path=screenshot,
                platform="novaplataforma"
            )

        except Exception as e:
            screenshot = await self._take_screenshot("novaplataforma", success=False)
            self.logger.error(f"Falha na candidatura: {e}")
            return ApplicationResult(
                success=False,
                status="Falhou",
                screenshot_path=screenshot,
                error_message=str(e),
                platform="novaplataforma"
            )

    async def _fill_form(self, fields: dict) -> None:
        for selector, value in fields.items():
            if value:
                await self._safe_fill(f'input[name*="{selector}"]', value)

    async def _upload_cv(self, file_input_selector: str) -> None:
        await self.page.set_input_files(file_input_selector, self.cv_path)
```

### Passo 2: Registrar no automation service

```python
# backend/app/services/automation/__init__.py ou registry

from app.services.automation.novaplataforma_applicator import NovaPlataformaApplicator

applicators = {
    "gupy": GupyApplicator,
    "novaplataforma": NovaPlataformaApplicator,  # ← adicionar
    "generic": GenericApplicator,  # fallback
}
```

---

## 7. Como Rodar Testes

### Backend

```bash
cd backend

# Todos os testes
uv run pytest

# Testes específicos
uv run pytest tests/test_matcher.py

# Com coverage
uv run pytest --cov=app --cov-report=html
```

### Frontend

```bash
cd frontend

# Testes unitários
ng test

# Testes com coverage
ng test --code-coverage
```

### E2E (futuro)

```bash
cd backend
uv run pytest tests/e2e/
```

---

## 8. Como Fazer Deploy

### Frontend (Firebase Hosting)

```bash
cd frontend

# Build de produção
ng build --configuration production

# Deploy
firebase deploy --only hosting
```

### Backend (Oracle Cloud Free — VM ARM)

A infraestrutura de produção roda em uma VM ARM Always Free da Oracle Cloud com SQLite local.

**Passo 1: Criar conta na Oracle Cloud**
1. Acessar https://cloud.oracle.com e criar conta (precisa cartão de crédito, mas não cobra)
2. O plano Always Free inclui 2 VMs ARM (Ampere A1) para sempre

**Passo 2: Criar a VM**
1. No console Oracle Cloud, ir em **Compute → Instances → Create Instance**
2. Configurar:
   - **Image:** Ubuntu 22.04 (aarch64)
   - **Shape:** VM.Standard.A1.Flex (Ampere A1 ARM)
   - **OCPU:** 2 (dentro do limite Always Free de até 4 OCPU)
   - **RAM:** 8GB (dentro do limite de até 24GB)
   - **Boot volume:** 50GB (dentro do limite de 200GB)
3. Adicionar chave SSH pública
4. Criar a instância

**Passo 3: Configurar a VM**
```bash
# Conectar via SSH
ssh ubuntu@<IP_PUBLICO_DA_VM>

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
# Fazer logout e login novamente

# Instalar git
sudo apt install -y git
```

**Passo 4: Deploy do backend**
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/jobhunter.git
cd jobhunter/backend

# Criar .env com variáveis de produção
cp .env.example .env
nano .env  # Configurar valores de produção (ver seção abaixo)

# Criar diretórios de storage
mkdir -p ./data ./storage/cv ./storage/screenshots

# Build da imagem Docker
docker build -t jobhunter-backend .

# Rodar o container
docker run -d \
  --name jobhunter \
  -p 8000:8000 \
  -v ./storage:/app/storage \
  -v ./data:/app/data \
  --env-file .env \
  --restart unless-stopped \
  jobhunter-backend

# Rodar migrations do banco
docker exec jobhunter alembic upgrade head

# Verificar se está rodando
curl http://localhost:8000/docs
```

**Passo 5: Configurar firewall**
1. No console Oracle Cloud, ir em **Networking → Virtual Cloud Networks**
2. Selecionar a VNC da instância
3. Ir em **Security Lists → Default Security List**
4. Adicionar Ingress Rule:
   - **Source CIDR:** 0.0.0.0/0
   - **Destination Port:** 8000
   - **Protocol:** TCP

**Passo 6: Acessar**
- Backend: `http://<IP_PUBLICO_DA_VM>:8000`
- Swagger: `http://<IP_PUBLICO_DA_VM>:8000/docs`

### Database (SQLite na VM)

O banco de dados é um arquivo SQLite local dentro da VM — sem servidor externo, sem limites artificiais.

```bash
# O arquivo fica em ./data/jobhunter.db dentro do container
# A pasta ./data é montada como volume persistente

# Backup manual (copiar o arquivo)
cp ./data/jobhunter.db ./backups/jobhunter_$(date +%Y%m%d).db

# Backup automatizado (adicionar ao crontab)
crontab -e
# Adicionar: 0 3 * * * cp /home/ubuntu/jobhunter/backend/data/jobhunter.db /home/ubuntu/jobhunter/backend/backups/jobhunter_$(date +\%Y\%m\%d).db
```

### Atualizar Variáveis de Produção

```typescript
// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'http://<IP_PUBLICO_DA_VM>:8000'
};
```

No `.env` da VM, configurar:
```bash
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db
ENVIRONMENT=production
FRONTEND_URL=https://<PROJETO>.web.app
SECRET_KEY=<gerar-uma-chave-aleatoria-grande>
```

---

## 9. Troubleshooting

| Problema | Solução |
|---|---|
| Playwright browsers não instalados | `uv run playwright install` |
| SQLite locked | Fechar outras conexões com `jobhunter.db` |
| Erro de CORS | Verificar se `FRONTEND_URL` no `.env` bate com a URL real do frontend |
| Scraper bloqueado pelo site | Aumentar `PLAYWRIGHT_SLOW_MO` no `.env`, verificar se tem Captcha |
| Jobs duplicados no APScheduler | Reiniciar backend (idempotência corrige automaticamente) |
| Upload de PDF falha | Verificar se `CV_STORAGE_PATH` existe e tem permissão de escrita |
| Angular não encontra componente | Verificar se o componente é `standalone: true` e está importado |
| Pydantic validation error 422 | Verificar campos obrigatórios no request body via Swagger |
| `uv sync` falha | Verificar se Python 3.14+ está instalado: `python --version` |
| E-mails não enviam | Verificar `SMTP_USER` e `SMTP_PASSWORD` no `.env` (usar App Password do Gmail) |

---

## 10. Referências

| Tecnologia | Documentação |
|---|---|
| Angular 21 | https://angular.dev |
| Tailwind CSS | https://tailwindcss.com |
| PrimeNG | https://primeng.org |
| FastAPI | https://fastapi.tiangolo.com |
| SQLAlchemy 2.x | https://docs.sqlalchemy.org |
| Playwright Python | https://playwright.dev/python/ |
| APScheduler | https://apscheduler.readthedocs.io |
| Pydantic v2 | https://docs.pydantic.dev |
| Alembic | https://alembic.sqlalchemy.org |
| uv | https://docs.astral.sh/uv/ |
| Oracle Cloud Free | https://cloud.oracle.com/free |
| Docker | https://docs.docker.com |
| Firebase Hosting | https://firebase.google.com/docs/hosting |
