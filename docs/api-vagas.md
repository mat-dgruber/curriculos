# APIs de Vagas de Emprego — Pesquisa e Análise

> Análise de APIs disponíveis para integração com o JobHunter.
>
> Atualizado: 2026-05-31

---

## Resumo Executivo

| API | Custo | Requests/mês | Vagas BR | Integração | Recomendação |
|-----|-------|--------------|----------|------------|--------------|
| LinkedIn API | Gratuito (limitado) | 100 | Sim | OAuth 2.0 | `Alternativa secundária` |
| Adzuna API | Grátis (500/mês) | 500 | Sim | API Key | `Recomendada` |
| Jooble API | Grátis (ilimitado) | Ilimitado | Sim | API Key | `Recomendada` |
| Remotive API | Grátis (ilimitado) | Ilimitado | Não (remoto) | API Key | `Para vagas remotas` |
| Gupy API | Grátis (não-oficial) | Ilimitado | Sim | HTTP direto | `Já implementada` |
| InfoJobs API | Gratuito (limitado) | Variável | Sim | OAuth | `Avaliar` |
| Indeed API | Descontinuada | — | — | — | `Não usar` |
| JSearch (RapidAPI) | Grátis (limitado) | 500/mês | Parcial | API Key | `Alternativa` |

---

## 1. LinkedIn API

### URL/Docs
- https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
- https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/authorization

### Autenticação
- OAuth 2.0 (Authorization Code Flow)
- Requer app registrado no LinkedIn Developer Portal

### Endpoints Relevantes
```
GET /v2/jobs/{jobId}          — Detalhe de uma vaga
GET /v2/jobs                  — Buscar vagas (limitado)
GET /v2/me                    — Perfil do usuário
```

### Limitações
- **Não existe API pública de busca de vagas** — o endpoint `GET /v2/jobs` requer permissão especial (partner tier)
- Apenas: buscar vaga por ID, listar vagas de uma empresa específica
- Rate limit: ~100 dias (varia por app)
- Não retorna resultados de busca genérica

### Viabilidade para JobHunter
- **Baixa** — Não permite busca livre de vagas
- Scraping via Playwright (já implementado) é mais útil
- Poderia ser usada para: enriquecer dados de vagas já encontradas

### Custo
- Gratuito, mas com limitações severas

---

## 2. Adzuna API

### URL/Docs
- https://developer.adzuna.com/overview
- https://developer.adzuna.com/apioverview

### Autenticação
- API Key (app_id + app_key)
- Cadastro gratuito em developer.adzuna.com

### Endpoints Relevantes
```
GET /v1/api/jobs/{country}/search/{page}   — Buscar vagas
GET /v1/api/jobs/{country}/histogram       — Histórico de vagas
GET /v1/api/jobs/{country}/top_companies   — Top empresas
GET /v1/api/jobs/{country}/top_skills      — Top skills
```

### Parâmetros de Busca
```json
{
  "what": "angular developer",
  "where": "São Paulo",
  "results_per_page": 20,
  "max_days_old": 7,
  "salary_min": 5000,
  "category": "IT"
}
```

### Retorno
```json
{
  "results": [{
    "title": "Desenvolvedor Angular",
    "company": {"display_name": "Tech Corp"},
    "location": {"display_name": "São Paulo, SP"},
    "description": "Buscamos dev Angular...",
    "salary_min": 6000,
    "salary_max": 10000,
    "redirect_url": "https://...",
    "created": "2026-05-30T10:00:00"
  }]
}
```

### Limitações
- Free tier: **500 requests/mês**
- Rate limit: 1 request/segundo
- País: Brasil disponível (country code: `br`)

### Viabilidade para JobHunter
- **Alta** — API completa, dados ricos, suporta Brasil
- Fácil integração com FastAPI

### Custo
- Free tier: $0 (500 req/mês)
- Pro: ~$50/mês (ilimitado)

---

## 3. Jooble API

### URL/Docs
- https://jooble.org/api/about
- https://jooble.org/api/

### Autenticação
- API Key (chave única por conta)

### Endpoint
```
POST https://jooble.org/api/
```

### Request
```json
{
  "keywords": "desenvolvedor angular",
  "location": "São Paulo, Brasil",
  "page": 1
}
```

### Retorno
```json
{
  "totalCount": 150,
  "jobs": [{
    "title": "Dev Angular",
    "company": "Empresa X",
    "location": "São Paulo, SP",
    "snippet": "Buscamos profissional...",
    "salary": "R$ 8.000 - R$ 12.000",
    "url": "https://...",
    "date": "2026-05-30"
  }]
}
```

### Limitações
- **Sem limite de requests** no free tier
- Rate limit: não documentado (prudente: 1 req/s)
- Suporta Brasil

### Viabilidade para JobHunter
- **Alta** — Ilimitado, simples, suporta Brasil
- Endpoint único (POST), fácil de integrar

### Custo
- Gratuito

---

## 4. Remotive API

### URL/Docs
- https://remotive.com/api-documentation

### Autenticação
- API Key via header `Authorization: Bearer {key}`

### Endpoint
```
GET https://remotive.com/api/remote-jobs
```

### Parâmetros
```
?category=software-dev
?search=angular
?limit=25
```

### Retorno
```json
{
  "job-count": 200,
  "jobs": [{
    "id": 12345,
    "title": "Angular Developer",
    "company_name": "Remote Co",
    "url": "https://...",
    "description": "...",
    "salary": "USD 5000-8000",
    "publication_date": "2026-05-30",
    "tags": ["angular", "typescript"]
  }]
}
```

### Limitações
- Apenas vagas remotas
- Sem limite de requests
- Atualizado diariamente

### Viabilidade para JobHunter
- **Média** — Excelente para vagas remotas, mas não cobre presenciais
- Bom complemento para as outras fontes

### Custo
- Gratuito

---

## 5. JSearch (RapidAPI)

### URL/Docs
- https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch

### Autenticação
- RapidAPI Key (header `X-RapidAPI-Key`)

### Endpoint
```
GET https://jsearch.p.rapidapi.com/search
```

### Parâmetros
```
?query=angular developer São Paulo
&page=1
?num_pages=1
```

### Retorno
```json
{
  "data": [{
    "job_title": "Angular Developer",
    "employer_name": "Tech Corp",
    "job_city": "São Paulo",
    "job_state": "SP",
    "job_description": "...",
    "job_min_salary": 6000,
    "job_max_salary": 10000,
    "job_apply_link": "https://..."
  }]
}
```

### Limitações
- Free tier: **500 requests/mês**
- Dados podem ser de aggregators (Glassdoor, Indeed)

### Viabilidade para JobHunter
- **Média** — Bom como fonte adicional, não como primária

### Custo
- Free tier: $0 (500 req/mês)
- Basic: $40/mês

---

## 6. Gupy API (Já Implementada)

### Status: `[COMPLETO]`
- HTTP API pública (sem autenticação)
- Scraping direto via requests HTTP
- Sem limite documentado
- Dados brasileiros

---

## 7. Indeed API

### Status: `[DESCONTINUADA]`
- Indeed descontinuou a API pública em 2024
- Não há substitute oficial
- Scraping viola ToS

---

## 8. InfoJobs API

### URL/Docs
- https://www.infojobs.com.br/employer/products/api.aspx

### Autenticação
- OAuth 2.0
- Requer cadastro de empresa

### Limitações
- Apenas para empresas que publicam vagas
- Não permite busca genérica de vagas

### Viabilidade para JobHunter
- **Baixa** — Não permite busca pública

---

## Recomendação de Implementação

### Tier 1 (Implementar primeiro)
1. **Jooble API** — Gratuito, ilimitado, simples
2. **Adzuna API** — 500 req/mês grátis, dados ricos

### Tier 2 (Complementar)
3. **Remotive API** — Para vagas remotas
4. **JSearch** — Fonte adicional

### Tier 3 (Já existe)
5. **Gupy** — Implementado ✅
6. **LinkedIn Playwright** — Implementado ✅
7. **Vagas Playwright** — Implementado ✅

### Arquitetura Sugerida

```
┌─────────────────────────────────────────┐
│            Scan Service                  │
│  (executa a cada 6 horas)               │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Gupy    │  │ LinkedIn │  │ Vagas  │ │
│  │  (HTTP)  │  │(Playwright│ │(PW+BS) │ │
│  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │            │       │
│  ┌────┴─────┐  ┌─────┴────┐ ┌───┴────┐  │
│  │  Jooble  │  │  Adzuna  │ │Remotive│  │
│  │  (API)   │  │  (API)   │ │ (API)  │  │
│  └────┬─────┘  └─────┬────┘ └───┬────┘  │
│       │              │            │       │
│       └──────────────┼────────────┘       │
│                      ▼                    │
│              ┌──────────────┐             │
│              │  Normalizer  │             │
│              │  (schema     │             │
│              │   unificado) │             │
│              └──────┬───────┘             │
│                     ▼                     │
│              ┌──────────────┐             │
│              │   Matcher    │             │
│              │  (scoring)   │             │
│              └──────┬───────┘             │
│                     ▼                     │
│              ┌──────────────┐             │
│              │   Database   │             │
│              │  (SQLite)    │             │
│              └──────────────┘             │
└─────────────────────────────────────────┘
```

### Estrutura de Código Sugerida

```python
# backend/app/services/scraper/jooble_scraper.py
class JoobleScraper(BaseScraper):
    """Scraper para Jooble API."""
    
    API_URL = "https://jooble.org/api/"
    
    async def search(self, keywords: str, location: str) -> list[dict]:
        response = await self.client.post(
            self.API_URL,
            json={"keywords": keywords, "location": location},
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return self._normalize(response.json().get("jobs", []))
    
    def _normalize(self, jobs: list[dict]) -> list[dict]:
        """Normaliza para schema unificado."""
        return [{
            "title": j.get("title"),
            "company": j.get("company"),
            "location": j.get("location"),
            "url": j.get("url"),
            "description": j.get("snippet"),
            "platform": "jooble"
        } for j in jobs]
```

### Migration Gradual

1. **Semanas 1-2:** Implementar Jooble + Adzuna
2. **Semanas 3-4:** Adicionar Remotive + JSearch
3. **Semanas 5-6:** Normalizar dados entre todas as fontes
4. **Semanas 7-8:** Testar e ajustar scoring multi-fonte
