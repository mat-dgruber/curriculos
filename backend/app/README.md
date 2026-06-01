# App -- Backend

Modulo principal da aplicacao JobHunter Backend.

## Estrutura

```
backend/app/
├── __init__.py
├── main.py                    # Entry point FastAPI
├── core/
│   ├── __init__.py
│   ├── config.py              # Settings (pydantic-settings)
│   ├── database.py            # Engine async, sessoes, Base ORM
│   ├── schema.py              # CamelModel (Pydantic camelCase)
│   └── seed.py                # Dados iniciais
├── models/
│   ├── __init__.py
│   ├── job.py                 # Job + schemas
│   ├── application.py         # Application + schemas
│   ├── company.py             # FixedCompany + schemas
│   └── profile.py             # CandidateProfile + schemas
├── api/
│   ├── __init__.py
│   └── routes/
│       ├── __init__.py
│       ├── jobs.py
│       ├── applications.py
│       ├── companies.py
│       ├── profile.py
│       └── scheduler.py
└── services/
    ├── __init__.py
    ├── matcher.py
    ├── scan_service.py
    ├── scheduler_service.py
    ├── recurring_service.py
    ├── notification_service.py
    ├── scraper/
    └── automation/
```

## Entry Point -- main.py

O `main.py` e o ponto de entrada da aplicacao FastAPI. Ele:

1. Cria a instancia `FastAPI` com titulo e versao
2. Configura CORS (permite origem do frontend)
3. Registra os routers da API (`/api/v1/...`)
4. No startup: inicializa o banco de dados (`init_db`) e inicia o scheduler
5. No shutdown: para o scheduler

```python
from fastapi import FastAPI

app = FastAPI(title="JobHunter API", version="1.0.0")

# CORS
app.add_middleware(CORSMiddleware, ...)

# Routers
app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/v1", tags=["Applications"])
app.include_router(companies.router, prefix="/api/v1", tags=["Companies"])
app.include_router(profile.router, prefix="/api/v1", tags=["Profile"])
app.include_router(scheduler.router, prefix="/api/v1", tags=["Scheduler"])

# Startup/Shutdown
@app.on_event("startup")
async def startup():
    await init_db()
    start_scheduler()
```

## Configuracao -- config.py

Usa `pydantic-settings` para carregar variaveis de ambiente do arquivo `.env`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./jobhunter.db"
    environment: str = "development"
    frontend_url: str = "http://localhost:4200"
    # ... mais variaveis
    model_config = {"env_file": ".env"}

settings = Settings()
```

Todas as configuracoes podem ser sobrescritas via variaveis de ambiente ou arquivo `.env`.

## Database Setup -- database.py

- **Engine**: SQLAlchemy async com `aiosqlite`
- **Session**: `async_sessionmaker` com `expire_on_commit=False`
- **Base**: `DeclarativeBase` para todos os models
- **init_db()**: Cria todas as tabelas via `Base.metadata.create_all`
- **get_db()**: Dependency do FastAPI para injetar sessoes nas rotas

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine(settings.database_url)
async_session = async_sessionmaker(engine, class_=AsyncSession)

async def get_db():
    async with async_session() as session:
        yield session
```

## Schema -- schema.py

`CamelModel` e uma classe base Pydantic que converte automaticamente snake_case para camelCase na serializacao JSON:

```python
class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,  # snake_case -> camelCase
        populate_by_name=True,
    )
```

Isso garante que a API retorne JSON com camelCase (padrao frontend) enquanto o Python usa snake_case.

## Seed -- seed.py

Cadastra dados iniciais para desenvolvimento:

- 1 perfil de candidato (Matheus Diniz, dev Angular/Python)
- 5 vagas de exemplo (LinkedIn, Gupy, Vagas.com)
- 2 candidaturas de exemplo
- 3 empresas fixas de exemplo

```bash
python -m app.core.seed
```
