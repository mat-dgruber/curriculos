# Testes -- Backend

Suite de testes automatizados do backend JobHunter.

## Estrutura

```
backend/tests/
├── __init__.py
├── conftest.py              # Fixtures compartilhadas (engine, db, client)
├── test_api_jobs.py         # Testes dos endpoints de jobs
├── test_api_applications.py # Testes dos endpoints de candidaturas
├── test_api_companies.py    # Testes dos endpoints de empresas fixas
├── test_api_profile.py      # Testes do endpoint de perfil
├── test_api_scheduler.py    # Testes do endpoint do scheduler
├── test_config.py           # Testes de configuracao (Settings)
├── test_models.py           # Testes dos models SQLAlchemy
└── test_matcher.py          # Testes do algoritmo de scoring
```

## Como Rodar

```bash
cd backend

# Rodar todos os testes
pytest

# Com verbose
pytest -v

# Com cobertura
pytest --cov=app --cov-report=term-missing

# Rodar um arquivo especifico
pytest tests/test_api_jobs.py -v

# Rodar um teste especifico
pytest tests/test_api_jobs.py::test_list_jobs -v

# Parar no primeiro erro
pytest -x
```

## Configuracao

O pytest esta configurado em `backend/pytest.ini`:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
```

- `asyncio_mode = auto` -- testes async sao executados automaticamente sem precisar de decorator
- `testpaths = tests` -- diretorio padrao de testes

## Fixtures

As fixtures estao definidas em `conftest.py`:

### `engine` (session scope)

Cria um engine SQLite async para testes (`test_jobhunter.db`). Cria todas as tabelas no inicio e remove ao final da sessao.

### `db` (function scope)

Fornece uma sessao `AsyncSession` isolada para cada teste. Limpa todas as tabelas apos cada execucao.

### `client` (function scope)

Fornece um `httpx.AsyncClient` conectado a aplicacao FastAPI via `ASGITransport`. Sobrescreve a dependency `get_db` para usar o banco de testes.

## Como Escrever Novos Testes

### Teste de API

```python
import pytest


@pytest.mark.asyncio
async def test_list_jobs(client):
    response = await client.get("/api/v1/jobs")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    response = await client.get("/api/v1/jobs/nonexistent-id")
    assert response.status_code == 404
```

### Teste de Model

```python
import pytest
from app.models.job import Job


@pytest.mark.asyncio
async def test_create_job(db):
    job = Job(
        title="Desenvolvedor Python",
        company="Tech Corp",
        location="Sao Paulo",
        platform="linkedin",
        url="https://linkedin.com/jobs/123",
        score=85,
        status="Nova",
    )
    db.add(job)
    await db.commit()

    from sqlalchemy import select
    result = await db.execute(select(Job).where(Job.id == job.id))
    found = result.scalar_one()
    assert found.title == "Desenvolvedor Python"
    assert found.score == 85
```

### Teste de Servico

```python
import pytest
from app.services.matcher import calculate_score
from app.services.scraper.base_scraper import ScrapedJob


def test_scoring_role_match():
    job = ScrapedJob(
        title="Desenvolvedor Angular Senior",
        company="Tech Corp",
        location="Sao Paulo",
        description="Vaga para Angular e TypeScript",
        url="https://example.com",
        platform="linkedin",
    )
    score = calculate_score(
        job,
        target_roles=["Desenvolvedor Angular"],
        keywords=["angular", "typescript"],
        preferred_locations=["Sao Paulo"],
    )
    assert score >= 70  # role match (40) + keywords (12) + location (20) + platform (10)
```

## Convencoes

- Todos os testes devem ser `async` (usando `pytest.mark.asyncio` ou `asyncio_mode = auto`)
- Cada teste deve ser independente -- nao depender de estado de outros testes
- Usar o fixture `client` para testes de API e `db` para testes de banco
- O banco de testes e criado e limpo automaticamente
- Nao usar o banco de producao (`jobhunter.db`) nos testes
