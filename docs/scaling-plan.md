# Escalonamento Futuro — JobHunter

> Plano detalhado de evolução da infraestrutura conforme o número de usuários cresce.
>
> Baseado em: docs/adr/005-scaling-strategy.md
>
> Atualizado: 2026-05-31

---

## 1. Visão Geral

```
Usuários    Fase    Custo/mês    Stack
─────────────────────────────────────────────────────
1           Fase 0  $0           SQLite + Oracle Free VM
2-10        Fase 1  $0           + Firebase Auth + Supabase Free
10-100      Fase 2  $0-25        + Celery + Redis + Supabase Pro
100+        Fase 3  $50-500      + Kubernetes + Managed DB + CDN
```

### Triggers para Transição

| Transição | Trigger | Ação |
|-----------|---------|------|
| 0 → 1 | Segundo usuário quer acessar | Implementar auth + multi-tenancy |
| 1 → 2 | SQLite com >10k registros lentos | Migrar para PostgreSQL |
| 2 → 2+ | APScheduler com latência >5min | Migrar para Celery+Redis |
| 2 → 3 | >100 usuários ativos | Kubernetes + managed services |

---

## 2. Fase 0 → Fase 1: Multi-usuário Básico

**Trigger:** Segundo usuário quer acessar o sistema.

**Custo:** $0/mês

**Esforço:** 8-11 dias

### 2.1 Firebase Authentication

#### Setup (passo a passo)

1. Criar projeto no Firebase Console
2. Habilitar Authentication → Email/Password + Google
3. Copiar config para o frontend:

```typescript
// frontend/src/environments/environment.ts
export const environment = {
  firebase: {
    apiKey: "AIza...",
    authDomain: "jobhunter-xxxxx.firebaseapp.com",
    projectId: "jobhunter-xxxxx",
    storageBucket: "jobhunter-xxxxx.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  }
};
```

4. Instalar SDK:

```bash
cd frontend
ng add @angular/fire
```

5. Configurar Auth Service:

```typescript
// frontend/src/app/core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private user = signal<User | null>(null);

  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(
      this.auth, email, password
    );
    const token = await credential.user.getIdToken();
    localStorage.setItem('auth_token', token);
    this.user.set(credential.user as User);
  }

  async register(email: string, password: string, role: string) {
    const credential = await createUserWithEmailAndPassword(
      this.auth, email, password
    );
    // Salvar role no backend
    await this.http.post('/api/v1/auth/register', { role }).toPromise();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.user();
  }
}
```

6. JWT Interceptor:

```typescript
// frontend/src/app/core/auth/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

### 2.2 Multi-tenancy (user_id em todas as tabelas)

#### Migration Alembic

```python
# alembic/versions/add_user_id.py
def upgrade():
    # Adicionar coluna user_id em todas as tabelas
    for table in ['jobs', 'applications', 'fixed_companies', 'candidate_profiles']:
        op.add_column(table, sa.Column('user_id', sa.String(36), nullable=True))
        op.create_index(f'ix_{table}_user_id', table, ['user_id'])
    
    # Backfill: associar dados existentes ao primeiro usuário
    op.execute("UPDATE jobs SET user_id = 'system-user' WHERE user_id IS NULL")
    op.execute("UPDATE applications SET user_id = 'system-user' WHERE user_id IS NULL")
    op.execute("UPDATE fixed_companies SET user_id = 'system-user' WHERE user_id IS NULL")
    op.execute("UPDATE candidate_profiles SET user_id = 'system-user' WHERE user_id IS NULL")
    
    # Tornar NOT NULL após backfill
    for table in ['jobs', 'applications', 'fixed_companies', 'candidate_profiles']:
        op.alter_column(table, 'user_id', nullable=False)
        op.create_foreign_key(f'fk_{table}_user_id', table, 'users', ['user_id'], ['id'])

def downgrade():
    for table in ['jobs', 'applications', 'fixed_companies', 'candidate_profiles']:
        op.drop_constraint(f'fk_{table}_user_id', table)
        op.drop_index(f'ix_{table}_user_id', table)
        op.drop_column(table, 'user_id')
```

### 2.3 Migração SQLite → Supabase PostgreSQL

#### Setup Supabase

1. Criar conta em supabase.com (free tier: 500MB)
2. Criar projeto
3. Copiar connection string:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

4. Atualizar .env:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:xxx@db.xxxxx.supabase.co:5432/postgres
```

5. Instalar driver asyncpg:

```bash
cd backend
uv add asyncpg
```

6. Gerar migrations:

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

#### Rollback Plan

```bash
# Voltar para SQLite
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db
alembic downgrade base  # ou remover colunas user_id
```

### 2.4 Angular Auth Components

- `LoginComponent` — Formulário de login
- `RegisterComponent` — Formulário de registro
- `AuthGuard` — Proteção de rotas
- `RoleGuard` — Verificação de papel

---

## 3. Fase 1 → Fase 2: Escala Média

**Trigger:** APScheduler com latência >5min ou >10k registros no banco.

**Custo:** $0-25/mês

**Esforço:** 8-12 dias

### 3.1 Supabase Pro vs PostgreSQL Self-hosted

| Critério | Supabase Pro | Self-hosted |
|----------|-------------|-------------|
| Custo | $25/mês | $0-10/mês (Oracle) |
| Manutenção | Gerenciada | Própria |
| Backups | Automáticos | Manual |
| Scalability | Built-in | Configurar manual |
| Recomendação | **Melhor opção** | Se precisar de controle total |

### 3.2 Docker Compose com Celery

```yaml
# docker-compose.yml (Fase 2)
version: '3.8'

services:
  api:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./data:/app/data
      - ./storage:/app/storage
    environment:
      - DATABASE_URL=postgresql+asyncpg://...
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped

  celery-worker:
    build: .
    command: celery -A app.tasks worker --loglevel=info --concurrency=4
    volumes:
      - ./storage:/app/storage
    environment:
      - DATABASE_URL=postgresql+asyncpg://...
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - api
    restart: unless-stopped

  celery-beat:
    build: .
    command: celery -A app.tasks beat --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

### 3.3 Celery Configuration

```python
# backend/app/tasks/__init__.py
from celery import Celery

celery_app = Celery(
    'jobhunter',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/0'
)

celery_app.conf.beat_schedule = {
    'scan-jobs-every-6-hours': {
        'task': 'app.tasks.scan_jobs',
        'schedule': 21600.0,  # 6 horas
    },
    'recurring-send-monthly': {
        'task': 'app.tasks.recurring_send',
        'schedule': 2592000.0,  # 30 dias
    },
}
```

### 3.4 Tasks

```python
# backend/app/tasks/scan.py
from app.tasks import celery_app

@celery_app.task(bind=True, max_retries=3)
def scan_jobs(self):
    """Scrapa vagas de todas as fontes configuradas."""
    try:
        # Lógica de scan...
        return {"status": "success", "jobs_found": count}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)
```

### 3.5 Rate Limiting

```python
# backend/app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    # 100 requests/min por IP (free tier)
    # 1000 requests/min por usuário autenticado
    pass
```

---

## 4. Fase 2 → Fase 3: Escala Grande

**Trigger:** >100 usuários ativos ou necessidade de alta disponibilidade.

**Custo:** $50-500/mês

**Esforço:** 20-30 dias

### 4.1 Kubernetes

| Opção | Custo | Complexidade | Recomendação |
|-------|-------|-------------|--------------|
| Oracle OKE | $0 (Always Free) | Média | Se manter no Oracle |
| AWS EKS | ~$73/mês + nodes | Alta | Melhor ecossistema |
| GCP GKE | ~$73/mês + nodes | Média | Melhor para ML |
| DigitalOcean | $12/mês + nodes | Baixa | Mais simples |

### 4.2 Managed PostgreSQL

- AWS RDS / Google Cloud SQL / Supabase Pro
- Read replicas para relatórios
- PgBouncer para connection pooling
- Backups automáticos

### 4.3 CDN

- Cloudflare Free Tier
- Cache de assets estáticos
- DDoS protection
- SSL gratuito

### 4.4 Stripe Billing

```python
# Planos sugeridos
plans = {
    "free": {
        "price": 0,
        "features": ["10 scans/mês", "50 vagas/mês", "Email básico"],
    },
    "pro": {
        "price": 29.90,
        "features": ["Scans ilimitados", "Vagas ilimitadas", "IA matching", "Relatórios"],
    },
    "enterprise": {
        "price": 99.90,
        "features": ["Tudo do Pro", "API access", "Suporte prioritário", "Custom branding"],
    },
}
```

---

## 5. Decision Points

| Quando | O quê | Como verificar |
|--------|-------|---------------|
| 2º usuário | Adicionar auth | Pedido de acesso |
| >10k registros | Migrar PostgreSQL | Queries >100ms |
| Queue >100 tasks | Adicionar workers | Monitor Redis queue |
| >100 usuários | Kubernetes | Requests >1000/min |
| Receita >$50/mês | Adicionar billing | Sustentabilidade |

---

## 6. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Oracle muda Always Free | Baixa | Alto | Backup + migrate para outro provider |
| Supabase Free 500MB | Média | Médio | Upgrade para Pro ($25) |
| Firebase Auth rate limit | Baixa | Médio | 10K users/mês é suficiente |
| Custos inesperados | Média | Alto | Budget alerts + monitoring |
| Downtime Oracle VM | Média | Alto | Health checks + auto-restart |

---

## 7. Arquitetura por Fase

### Fase 0 (Atual)
```
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Angular    │────▶│   FastAPI    │────▶│  SQLite  │
│   (Firebase) │     │ (Oracle VM)  │     │  (VM)    │
└──────────────┘     └──────────────┘     └──────────┘
                            │
                     ┌──────┴──────┐
                     │  Playwright │
                     │  Scrapers   │
                     └─────────────┘
```

### Fase 1
```
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Angular    │────▶│   FastAPI    │────▶│Supabase  │
│ + Auth Guard │     │ + JWT Auth   │     │PostgreSQL│
└──────────────┘     └──────────────┘     └──────────┘
       │                     │
  Firebase Auth        user_id filter
```

### Fase 2
```
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Angular    │────▶│   FastAPI    │────▶│Supabase  │
│ + Auth Guard │     │ + Rate Limit │     │ Pro      │
└──────────────┘     └──────┬───────┘     └──────────┘
                            │
                     ┌──────┴──────┐
                     │    Redis    │
                     └──────┬──────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
         ┌──────┴──────┐ ┌─┴────────┐ ┌┴─────────┐
         │ Celery Beat │ │ Worker 1 │ │ Worker 2 │
         │ (scheduler) │ │ (scrape) │ │ (apply)  │
         └─────────────┘ └──────────┘ └──────────┘
```

### Fase 3
```
┌─────────────┐
│   CDN       │  Cloudflare
│  (Angular)  │
└──────┬──────┘
       │
┌──────┴──────┐
│  Ingress    │  Kubernetes
│  Controller │
└──────┬──────┘
       │
┌──────┴──────────────────────┐
│                              │
│  ┌─────────┐  ┌─────────┐  │
│  │ API Pod │  │ API Pod │  │  ← HPA (auto-scale)
│  └────┬────┘  └────┬────┘  │
│       │             │       │
│  ┌────┴─────────────┴────┐  │
│  │    Celery Workers     │  │  ← Auto-scale 2-10
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────┴───────────┐  │
│  │   Managed PostgreSQL  │  │  + Read Replicas
│  │   + PgBouncer         │  │
│  └───────────────────────┘  │
│                              │
│  ┌───────────┐               │
│  │   Redis   │               │
│  └───────────┘               │
│                              │
│  ┌───────────┐               │
│  │ S3/Storage│               │
│  └───────────┘               │
└──────────────────────────────┘
```

---

## 8. Checklist de Migração

### Fase 0 → 1
- [ ] Criar projeto Firebase
- [ ] Configurar Auth (Email + Google)
- [ ] Instalar @angular/fire
- [ ] Criar AuthService
- [ ] Criar AuthInterceptor
- [ ] Criar LoginComponent
- [ ] Criar RegisterComponent
- [ ] Criar AuthGuard + RoleGuard
- [ ] Criar tabela users no banco
- [ ] Adicionar user_id em todas as tabelas (Alembic)
- [ ] Backfill de dados existentes
- [ ] Testar com 2 usuários
- [ ] Atualizar todos os endpoints para filtrar por user_id

### Fase 1 → 2
- [ ] Configurar Supabase Pro
- [ ] Criar docker-compose.yml com Celery
- [ ] Instalar Redis
- [ ] Configurar Celery + Beat
- [ ] Migrar tasks do APScheduler para Celery
- [ ] Configurar rate limiting
- [ ] Monitorar queue depth
- [ ] Testar com 10+ usuários

### Fase 2 → 3
- [ ] Escolher provider K8s
- [ ] Configurar cluster
- [ ] Criar Dockerfiles otimizados
- [ ] Configurar HPA
- [ ] Migrar para Managed PostgreSQL
- [ ] Configurar PgBouncer
- [ ] Configurar CDN
- [ ] Integrar Stripe
- [ ] Configurar WAF
- [ ] Testar com 100+ usuários

---

## 9. Benchmarks e Métricas

### Métricas para Monitorar

| Métrica | Fase 0 | Fase 1 | Fase 2 | Fase 3 |
|---------|--------|--------|--------|--------|
| Requests/min | <10 | <50 | <500 | <5000 |
| Latência P95 | <2s | <1s | <500ms | <200ms |
| Uptime | 95% | 99% | 99.9% | 99.99% |
| DB size | <100MB | <500MB | <5GB | <50GB |
| Concurrent users | 1 | 10 | 100 | 1000+ |

### Triggers de Escalonamento

```
IF latency_p95 > 2s FOR 1 hour THEN → investigar
IF latency_p95 > 5s FOR 30 min THEN → escalar horizontal
IF db_size > 80% do limite THEN → migrar/upgrades
IF error_rate > 1% THEN → alertar
IF queue_depth > 1000 THEN → adicionar workers
```
