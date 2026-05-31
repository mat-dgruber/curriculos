# Specs — Data Models (SQLAlchemy 2.x + Pydantic)

## Convenções Gerais

- ORM: **SQLAlchemy 2.x** com suporte async
- Validação: **Pydantic v2** schemas para request/response
- Migrations: **Alembic** — cada mudança de schema gera migration
- IDs: **UUID** como primary key (não auto-increment)
- Timestamps: `created_at` e `updated_at` em todos os modelos (UTC)
- Soft delete não implementado no MVP (hard delete com audit log)
- Banco: **SQLite** no dev e produção (Oracle Cloud VM ARM). **PostgreSQL** via Supabase Free apenas se precisar escalar para multi-user no futuro

---

## 1. Job (Vaga)

Representa uma vaga de emprego encontrada pelos scrapers.

### SQLAlchemy Model

```python
# backend/app/models/job.py

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime, Float, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # linkedin, gupy, vagas
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    requirements: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array como string
    salary_range: Mapped[str] = mapped_column(String(100), nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0-100
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Nova")
    found_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications: Mapped[list["Application"]] = relationship(back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_score", "score"),
        Index("ix_jobs_platform", "platform"),
        Index("ix_jobs_found_at", "found_at"),
        Index("ix_jobs_platform_status", "platform", "status"),
    )
```

### Status Válidos

| Status | Significado |
|---|---|
| `Nova` | Vaga recém-encontrada pelo scraper |
| `Visualizada` | Usuário abriu os detalhes da vaga |
| `Candidatou` | Usuário ou sistema enviou candidatura |

### Pydantic Schemas

```python
from pydantic import BaseModel, Field
from datetime import datetime

class JobCreate(BaseModel):
    title: str = Field(..., max_length=255)
    company: str = Field(..., max_length=255)
    location: str = Field(..., max_length=255)
    platform: str = Field(..., pattern=r"^(linkedin|gupy|vagas)$")
    url: str = Field(..., max_length=1024)
    description: str | None = None
    requirements: str | None = None
    salary_range: str | None = Field(None, max_length=100)

class JobRead(BaseModel):
    id: str
    title: str
    company: str
    location: str
    platform: str
    url: str
    description: str | None
    requirements: str | None
    salary_range: str | None
    score: int
    status: str
    found_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class JobUpdate(BaseModel):
    status: str | None = Field(None, pattern=r"^(Nova|Visualizada|Candidatou)$")
    score: int | None = Field(None, ge=0, le=100)

class JobListResponse(BaseModel):
    items: list[JobRead]
    total: int
    page: int
    per_page: int
    pages: int
```

### Dados de Exemplo

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Desenvolvedor Angular Sênior",
  "company": "Tech Corp Brasil",
  "location": "São Paulo, SP (Remoto)",
  "platform": "linkedin",
  "url": "https://linkedin.com/jobs/view/1234567890",
  "description": "Buscamos desenvolvedor Angular com experiência em projetos escaláveis...",
  "requirements": "[\"Angular 15+\", \"TypeScript\", \"RxJS\", \"5+ anos de experiência\"]",
  "salary_range": "R$ 12.000 - R$ 18.000",
  "score": 85,
  "status": "Nova",
  "found_at": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

## 2. Application (Candidatura)

Representa uma candidatura enviada (manual ou automática) para uma vaga.

### SQLAlchemy Model

```python
# backend/app/models/application.py

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)  # Desnormalizado para histórico
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pendente")
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    screenshot_path: Mapped[str] = mapped_column(String(512), nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign keys opcionais
    fixed_company_id: Mapped[str] = mapped_column(String(36), ForeignKey("fixed_companies.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    job: Mapped["Job"] = relationship(back_populates="applications")
    fixed_company: Mapped["FixedCompany | None"] = relationship(back_populates="applications")

    __table_args__ = (
        Index("ix_applications_status", "status"),
        Index("ix_applications_sent_at", "sent_at"),
        Index("ix_applications_job_id", "job_id"),
        Index("ix_applications_fixed_company_id", "fixed_company_id"),
        Index("ix_applications_is_recurring", "is_recurring"),
    )
```

### Status Válidos e Transições

```
Pendente  →  Enviado   (sucesso no envio)
Pendente  →  Falhou    (erro na automação)
Falhou    →  Pendente  (retry manual ou automático)
Enviado   →  Arquivado (usuário arquiva)
Qualquer  →  Arquivado (usuário arquiva)
```

**Regra de negócio:** Status `Enviado` NUNCA pode voltar para `Pendente`. O fluxo é unidirecional exceto para retry de `Falhou`.

### Pydantic Schemas

```python
from pydantic import BaseModel, Field
from datetime import datetime

class ApplicationCreate(BaseModel):
    job_id: str = Field(..., description="UUID da vaga")
    notes: str | None = Field(None, max_length=1000)

class ApplicationRead(BaseModel):
    id: str
    job_id: str
    job_title: str  # Via relationship
    company_name: str
    status: str
    is_recurring: bool
    notes: str | None
    error_message: str | None
    screenshot_path: str | None
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(Pendente|Enviado|Falhou|Arquivado)$")
    notes: str | None = Field(None, max_length=1000)
    error_message: str | None = Field(None, max_length=2000)

class ApplicationListResponse(BaseModel):
    items: list[ApplicationRead]
    total: int
    page: int
    per_page: int
    pages: int
```

### Regras de Negócio

1. **Transições unidirecionais:** `Enviado` → `Pendente` é bloqueado no service layer
2. **Retry:** Apenas candidaturas com status `Falhou` podem voltar para `Pendente`
3. **Screenshot obrigatório:** Toda automação que tenta enviar DEVE capturar screenshot (sucesso ou falha)
4. **company_name desnormalizado:** Copiado do job no momento da criação para preservar histórico mesmo se a vaga for removida
5. **is_recurring:** `true` quando criada pelo job de envio recorrente mensal de empresas fixas

### Dados de Exemplo

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "job_title": "Desenvolvedor Angular Sênior",
  "company_name": "Tech Corp Brasil",
  "status": "Enviado",
  "is_recurring": false,
  "notes": "Candidatura via painel manual",
  "error_message": null,
  "screenshot_path": "/storage/screenshots/2025-01-15_14-00-00.png",
  "sent_at": "2025-01-15T14:00:00Z",
  "created_at": "2025-01-15T13:55:00Z",
  "updated_at": "2025-01-15T14:00:05Z"
}
```

---

## 3. FixedCompany (Empresa Fixa)

Representa uma empresa cadastrada para envio recorrente mensal de currículo.

### SQLAlchemy Model

```python
# backend/app/models/company.py

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class FixedCompany(Base):
    __tablename__ = "fixed_companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    application_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Ativo")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    last_sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    next_send_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    total_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications: Mapped[list["Application"]] = relationship(back_populates="fixed_company")

    __table_args__ = (
        Index("ix_fixed_companies_status", "status"),
        Index("ix_fixed_companies_is_active", "is_active"),
        Index("ix_fixed_companies_next_send_at", "next_send_at"),
    )
```

### Status Válidos

| Status | Significado | Condição |
|---|---|---|
| `Ativo` | Envio recorrente ativo | `is_active = True` |
| `Pausado` | Envio pausado pelo usuário | `is_active = False` |
| `Respondeu` | Empresa respondeu (para envios) | Status final, não pode reativar |

### Pydantic Schemas

```python
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class FixedCompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    application_url: str = Field(..., max_length=1024)  # URL do formulário
    interval_days: int = Field(30, ge=7, le=90)  # Entre 7 e 90 dias
    notes: str | None = Field(None, max_length=1000)

class FixedCompanyRead(BaseModel):
    id: str
    name: str
    application_url: str
    status: str
    is_active: bool
    interval_days: int
    notes: str | None
    last_sent_at: datetime | None
    next_send_at: datetime | None
    total_sent: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class FixedCompanyUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    application_url: str | None = Field(None, max_length=1024)
    interval_days: int | None = Field(None, ge=7, le=90)
    notes: str | None = Field(None, max_length=1000)

class FixedCompanyListResponse(BaseModel):
    items: list[FixedCompanyRead]
    total: int
    page: int
    per_page: int
    pages: int
```

### Regras de Negócio

1. **Envio recorrente:** O job mensal verifica `is_active = True` e `status != "Respondeu"` antes de enviar
2. **Status "Respondeu":** Quando a empresa responde (positiva ou negativamente), o sistema para automaticamente os envios recorrentes
3. **Toggle pausar/ativar:** Alterna `is_active` e atualiza `status` (Ativo ↔ Pausado). Bloqueado se `status = "Respondeu"`
4. **next_send_at:** Calculado como `last_sent_at + interval_days`. Se `last_sent_at` for null, usa `created_at + interval_days`
5. **total_sent:** Incrementado a cada envio bem-sucedido (via job recorrente ou manual)
6. **interval_days:** Limitado entre 7 e 90 dias para evitar spam ou intervalos muito curtos

### Dados de Exemplo

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "Banco XYZ",
  "application_url": "https://bancoxyz.com.br/trabalhe-conosco",
  "status": "Ativo",
  "is_active": true,
  "interval_days": 30,
  "notes": "Formulário simples, aceita upload de PDF direto. Campo de texto livre para experiência.",
  "last_sent_at": "2025-01-01T10:00:00Z",
  "next_send_at": "2025-02-01T10:00:00Z",
  "total_sent": 3,
  "created_at": "2024-10-01T00:00:00Z",
  "updated_at": "2025-01-01T10:00:05Z"
}
```

---

## 4. CandidateProfile (Perfil do Candidato)

Representa o perfil profissional do usuário. Singleton — existe apenas um registro.

### SQLAlchemy Model

```python
# backend/app/models/profile.py

from datetime import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    target_role: Mapped[str] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str] = mapped_column(String(512), nullable=True)
    cv_filename: Mapped[str] = mapped_column(String(255), nullable=True)
    cv_uploaded_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Configurações de busca (JSON como string no SQLite)
    keywords: Mapped[str] = mapped_column(Text, nullable=True)  # JSON: ["angular", "python", "typescript"]
    target_roles: Mapped[str] = mapped_column(Text, nullable=True)  # JSON: ["Desenvolvedor Frontend", "Full Stack"]
    preferred_locations: Mapped[str] = mapped_column(Text, nullable=True)  # JSON: ["São Paulo", "Remoto"]
    scan_interval_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=6)
    auto_apply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_candidate_profiles_email", "email"),
    )
```

### Nota sobre JSON fields

SQLite não suporta tipo JSON nativamente. Os campos `keywords`, `target_roles` e `preferred_locations` são armazenados como **texto JSON** (string serializada). O Pydantic faz a conversão automática:

```python
import json

# No service layer:
profile.keywords = json.dumps(["angular", "python"])  # Salvar
keywords = json.loads(profile.keywords)                # Ler
```

Alternativa futura: usar `sqlalchemy.dialects.postgresql.JSON` quando migrar para PostgreSQL (via Supabase Free).

### Pydantic Schemas

```python
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class CandidateProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: str | None = Field(None, max_length=20)
    location: str | None = Field(None, max_length=255)
    target_role: str | None = Field(None, max_length=255)
    linkedin_url: str | None = Field(None, max_length=512)

class CandidateProfileRead(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None
    location: str | None
    target_role: str | None
    linkedin_url: str | None
    cv_filename: str | None
    cv_uploaded_at: datetime | None
    keywords: list[str]
    target_roles: list[str]
    preferred_locations: list[str]
    scan_interval_hours: int
    auto_apply: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class CandidateProfileUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    location: str | None = Field(None, max_length=255)
    target_role: str | None = Field(None, max_length=255)
    linkedin_url: str | None = Field(None, max_length=512)
    keywords: list[str] | None = None
    target_roles: list[str] | None = None
    preferred_locations: list[str] | None = None
    scan_interval_hours: int | None = Field(None, ge=1, le=72)
    auto_apply: bool | None = None
```

### Regras de Negócio

1. **Singleton:** Existe apenas um perfil no sistema (uso pessoal). Se não existir, retorna 404 no GET.
2. **keywords:** Usado pelo `matcher.py` para calcular score de compatibilidade com vagas
3. **auto_apply:** Se `true`, candidaturas são criadas automaticamente para vagas com score ≥ 80%
4. **scan_interval_hours:** Define frequência do job de varredura no APScheduler (1-72 horas)
5. **cv_filename:** Apenas o nome do arquivo. O PDF real fica em `./storage/cv/` com hash como nome no disco
6. **cv_uploaded_at:** Atualizado toda vez que um novo PDF é enviado (substitui o anterior)

### Dados de Exemplo

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "name": "Matheus Diniz",
  "email": "matheus@email.com",
  "phone": "+55 11 99999-0000",
  "location": "São Paulo, SP",
  "target_role": "Desenvolvedor Angular/Python",
  "linkedin_url": "https://linkedin.com/in/matheusdiniz",
  "cv_filename": "curriculo_matheus.pdf",
  "cv_uploaded_at": "2025-01-10T00:00:00Z",
  "keywords": ["angular", "python", "typescript", "fastapi", "playwright"],
  "target_roles": ["Desenvolvedor Frontend", "Desenvolvedor Full Stack", "Engenheiro de Software"],
  "preferred_locations": ["São Paulo", "Remoto", "Híbrido"],
  "scan_interval_hours": 6,
  "auto_apply": false,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T00:00:00Z"
}
```

---

## Diagrama de Relacionamentos

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Job       │       │  Application    │       │ FixedCompany    │
│─────────────│       │─────────────────│       │─────────────────│
│ id (PK)      │◄──┐   │ id (PK)         │   ┌──►│ id (PK)         │
│ title        │   └───│ job_id (FK)     │   │   │ name            │
│ company      │       │ fixed_company_id│───┘   │ application_url │
│ location     │       │ company_name    │       │ status          │
│ platform     │       │ status          │       │ is_active       │
│ url          │       │ is_recurring    │       │ interval_days   │
│ description  │       │ screenshot_path │       │ last_sent_at    │
│ score        │       │ sent_at         │       │ next_send_at    │
│ status       │       │ error_message   │       │ total_sent      │
│ found_at     │       │ notes           │       │ notes           │
└─────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐
│ CandidateProfile │  (Singleton — 1 registro)
│─────────────────│
│ id (PK)          │
│ name             │
│ email            │
│ phone            │
│ location         │
│ target_role      │
│ cv_filename      │
│ keywords (JSON)  │
│ target_roles     │
│ preferred_loc    │
│ scan_interval    │
│ auto_apply       │
└─────────────────┘
```

---

## Índices Consolidados

| Tabela | Índice | Colunas | Motivo |
|---|---|---|---|
| jobs | ix_jobs_status | status | Filtro por status na listagem |
| jobs | ix_jobs_score | score | Ordenação/filtro por score |
| jobs | ix_jobs_platform | platform | Filtro por plataforma |
| jobs | ix_jobs_found_at | found_at | Ordenação cronológica |
| jobs | ix_jobs_platform_status | platform, status | Filtro combinado frequente |
| applications | ix_applications_status | status | Filtro por status |
| applications | ix_applications_sent_at | sent_at | Ordenação cronológica |
| applications | ix_applications_job_id | job_id | Join com jobs |
| applications | ix_applications_fixed_company_id | fixed_company_id | Join com fixed_companies |
| applications | ix_applications_is_recurring | is_recurring | Filtro por tipo |
| fixed_companies | ix_fixed_companies_status | status | Filtro por status |
| fixed_companies | ix_fixed_companies_is_active | is_active | Job recorrente filtra por ativo |
| fixed_companies | ix_fixed_companies_next_send_at | next_send_at | Job verifica próximo envio |
| candidate_profiles | ix_candidate_profiles_email | email | Lookup por email |
