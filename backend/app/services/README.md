# Services -- Backend

Modulo de logica de negocio do JobHunter.

## Visao Geral

```
services/
├── __init__.py
├── matcher.py                  # Scoring 0-100%
├── scan_service.py             # Orquestra varredura completa
├── scheduler_service.py        # APScheduler (jobs periodicos)
├── recurring_service.py        # Envio para empresas fixas
├── notification_service.py     # Notificacoes por email
├── scraper/
│   ├── __init__.py
│   ├── base_scraper.py         # ABC + ScrapedJob
│   ├── gupy_scraper.py         # Scraper Gupy
│   ├── linkedin_scraper.py     # Scraper LinkedIn
│   └── vagas_scraper.py        # Scraper Vagas.com
└── automation/
    ├── __init__.py
    ├── base_applicator.py      # ABC + ApplicationResult
    ├── gupy_applicator.py      # Applicator Gupy
    └── generic_applicator.py   # Applicator generico
```

---

## Arquitetura de Scrapers

### Hierarquia

```
BaseScraper (ABC)
├── GupyScraper
├── LinkedInScraper
└── VagasScraper
```

### BaseScraper

Classe abstrata que fornece:

- Gerenciamento de lifecycle (async context manager com Playwright)
- Metodos auxiliares: `_safe_goto`, `_safe_click`, `_safe_fill`, `_random_delay`
- Anti-bot: delays aleatorios entre acoes
- Interface: `scrape(search_params: dict) -> list[ScrapedJob]`

### ScrapedJob

DTO com os dados extraidos de uma vaga:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `title` | `str` | Titulo da vaga |
| `company` | `str` | Nome da empresa |
| `location` | `str` | Localizacao |
| `description` | `str` | Descricao completa |
| `url` | `str` | Link direto para a vaga |
| `platform` | `str` | "linkedin", "gupy" ou "vagas" |
| `salary_range` | `str \| None` | Faixa salarial (se disponivel) |
| `requirements` | `list[str] \| None` | Requisitos |

### Scrapers Concretos

| Scraper | Plataforma | Metodologia |
|---------|-----------|-------------|
| `GupyScraper` | Gupy | Navega na busca, extrai cards de vagas |
| `LinkedInScraper` | LinkedIn | Busca por keyword + localizacao |
| `VagasScraper` | Vagas.com | Scraping da pagina de busca |

Todos usam Playwright headless com Chrome, navigacao com waits inteligentes e extracao via seletores CSS.

---

## Applicators de Automacao

### Hierarquia

```
BaseApplicator (ABC)
├── GupyApplicator
└── GenericApplicator
```

### BaseApplicator

Classe abstrata para automacao de candidaturas:

- Gerenciamento de lifecycle (Playwright)
- Preenchimento automatico de formularios
- Screenshots de evidencia (sucesso/falha)
- Interface: `apply(job_url, job_title, company_name) -> ApplicationResult`

### ApplicationResult

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `success` | `bool` | Se a candidatura foi enviada |
| `status` | `str` | "Enviado" ou "Falhou" |
| `screenshot_path` | `str \| None` | Caminho do screenshot |
| `error_message` | `str \| None` | Mensagem de erro (se falhou) |
| `platform` | `str` | Plataforma de origem |

### Applicators Concretos

| Applicator | Descricao |
|------------|-----------|
| `GupyApplicator` | Preenche formularios especificos da Gupy |
| `GenericApplicator` | Tenta preencher campos comuns (nome, email, CV) |

---

## Algoritmo Matcher -- matcher.py

O scoring de compatibilidade vai de 0 a 100 pontos:

| Componente | Pontos | Descricao |
|-----------|--------|-----------|
| Role match no titulo | 40 | Se o cargo-alvo aparece no titulo da vaga |
| Keywords na descricao | ate 30 | 6 pontos por keyword encontrada (max 5 keywords) |
| Localizacao | 20 | Se a localizacao preferida corresponde |
| Plataforma confiavel | 10 | Bonus para LinkedIn e Gupy |

```python
def calculate_score(job, target_roles, keywords, preferred_locations) -> int:
    score = 0

    # Role match (40pts)
    for role in target_roles:
        if role.lower() in job.title.lower():
            score += 40
            break

    # Keywords (ate 30pts)
    for kw in keywords[:5]:
        if kw.lower() in job.description.lower():
            score += 6

    # Localizacao (20pts)
    for loc in preferred_locations:
        if loc.lower() in job.location.lower():
            score += 20
            break

    # Plataforma (10pts)
    if job.platform in ("linkedin", "gupy"):
        score += 10

    return min(score, 100)
```

---

## Scheduler -- scheduler_service.py

Usa APScheduler (AsyncIOScheduler) para executar tarefas periodicas:

| Job | Trigger | Descricao |
|-----|---------|-----------|
| `scan_jobs` | Intervalo (configuravel, default 6h) | Varre LinkedIn, Gupy e Vagas.com |
| `recurring_send` | Cron (dia do mes, default dia 1 as 10h) | Envia curriculos para empresas fixas |

Funcionalidades:
- **Pause/Resume**: Pausa todos os jobs do scheduler
- **Trigger manual**: Dispara um job imediatamente via API
- **Status**: Retorna estado de cada job (ultimo run, proximo run, status)

---

## Notificacoes -- notification_service.py

Envia emails via SMTP (Gmail ou outro provedor):

| Funcao | Descricao |
|--------|-----------|
| `notify_new_jobs(count, platform_summary)` | Novas vagas encontradas |
| `notify_application_success(title, company, platform)` | Candidatura enviada com sucesso |
| `notify_application_failure(title, company, error)` | Falha na candidatura |
| `notify_recurring_send(company, total, success)` | Resultado do envio recorrente |

Os emails sao formatados em HTML e enviados com o prefixo `[JobHunter]` no assunto.

---

## Scan Service -- scan_service.py

Orquestra o fluxo completo de varredura:

1. Carrega o perfil do candidato
2. Executa todos os scrapers (Gupy, LinkedIn, Vagas.com)
3. Pontua cada vaga com o matcher
4. Filtra vagas duplicadas (por URL)
5. Salva novas vagas no banco

Retorna um resumo com contagem de vagas novas, total scrapadas e distribuicao por plataforma.
