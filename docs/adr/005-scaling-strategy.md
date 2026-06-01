# ADR-005: Estratégia de Escala (Single-User → Multi-User)

## Status

Accepted

---

## Contexto

O JobHunter atualmente roda como ferramenta pessoal (single-user) na Oracle Cloud Free VM ARM com SQLite. O usuário tem planos de crescer para múltiplos usuários no futuro.

A necessidade é documentar **quando** e **como** escalar sem over-engineering o MVP atual. A restrição principal: a arquitetura atual deve funcionar para single-user a custo zero, mas estar preparada para a transição multi-user quando necessário.

Decisões de escala tomadas cedo demais atrasam o MVP e adicionam complexidade desnecessária. Decisões tomadas tarde demais causam downtime e refatoração urgente.

---

## Decisão

### Fase 0 (Atual): MVP Single-User

| Aspecto | Decisão |
|---|---|
| Banco | SQLite local na Oracle Cloud VM ARM |
| Autenticação | Nenhuma (uso pessoal) |
| Perfil | Um único CandidateProfile (singleton) |
| Scheduler | APScheduler no mesmo processo do FastAPI |
| Storage | Filesystem local da VM |
| Custo | $0/mês |

**Trigger para próxima fase:** Segundo usuário querendo usar o sistema.

---

### Fase 1: Multi-User Básico (2-10 usuários)

**Trigger:** Segundo usuário se cadastra.

1. **Firebase Authentication** (email/senha + Google Sign-In)
   - Passo obrigatório — todas as rotas da API passam a exigir JWT token
   - Middleware no FastAPI para validar token em cada request
   - Tela de login/registro no frontend Angular
   - Free tier: 10.000 usuários ativos/mês

2. **Multi-tenancy no banco**
   - Adicionar coluna `user_id` em todas as tabelas (Job, Application, FixedCompany, CandidateProfile)
   - Todas as queries filtram por `user_id` do token JWT
   - CandidateProfile deixa de ser singleton → um por usuário
   - Foreign key para tabela de usuários

3. **Migrar SQLite → Supabase Free**
   - SQLite não suporta múltiplos usuários escrevendo simultaneamente
   - Supabase Free: 500MB PostgreSQL managed, dashboard web, backups automáticos
   - Alembic cuida da migration do schema (SQLAlchemy abstrai o banco)
   - Apenas muda `DATABASE_URL` no `.env`

4. **Isolamento de storage**
   - CVs: `./storage/cv/{user_id}/curriculo.pdf`
   - Screenshots: `./storage/screenshots/{user_id}/`
   - Cada usuário vê apenas seus próprios arquivos

| Aspecto | Decisão |
|---|---|
| Auth | Firebase Authentication |
| Banco | Supabase Free (PostgreSQL, 500MB) |
| Multi-tenancy | user_id em todas as tabelas |
| Esforço | ~8-11 dias de dev |
| Custo | $0/mês |

---

### Fase 2: Crescimento (10-100 usuários)

**Trigger:** Supabase Free atingindo 300MB+ de storage.

1. **Banco de dados pago**
   - Supabase Pro: $25/mês, 8GB storage, sem limites de conexão
   - OU PostgreSQL self-hosted na VM Oracle Cloud (se a VM aguentar a carga)

2. **Docker Compose — separação de serviços**
   - FastAPI (API) em container separado
   - Celery Workers (automação Playwright) em container separado
   - Celery Beat (scheduler) em container separado
   - Redis como broker de filas

3. **Celery + Redis substitui APScheduler**
   - APScheduler no mesmo processo não escala com múltiplos usuários
   - Celery processa candidaturas em paralelo (um worker por usuário)
   - Redis gerencia a fila de jobs

4. **Monitoramento**
   - Logs centralizados (Loki ou Supabase logs)
   - Métricas de uso (usuários ativos, vagas, candidaturas)
   - Alertas de erro por e-mail ou Slack

| Aspecto | Decisão |
|---|---|
| Banco | Supabase Pro ($25/mês) ou PG self-hosted |
| Workers | Celery + Redis (Docker) |
| Orquestração | Docker Compose |
| Esforço | ~8-12 dias de dev |
| Custo | $0-25/mês |

---

### Fase 3: Escala Real (100+ usuários)

**Trigger:** Recursos da VM Oracle Cloud esgotados (CPU, RAM, storage).

1. **Infraestrutura profissional**
   - Migrar para cloud provider pago (AWS, GCP, Railway)
   - Kubernetes para orquestração de containers
   - Load balancer para distribuir tráfego

2. **Banco de dados profissional**
   - PostgreSQL gerenciado (AWS RDS, GCP Cloud SQL)
   - Read replicas para consultas pesadas
   - Connection pooling (PgBouncer)

3. **Storage profissional**
   - S3 ou equivalente para CVs e screenshots
   - CDN para assets estáticos
   - Limite de storage por usuário

4. **Billing e planos**
   - Sistema de planos: Free, Pro, Enterprise
   - Stripe para processamento de pagamentos
   - Limites por plano (vagas/dia, empresas fixas, etc.)

5. **Segurança profissional**
   - Rate limiting por usuário
   - WAF (Web Application Firewall)
   - Auditoria de ações (logs imutáveis)
   - Criptografia em repouso

| Aspecto | Decisão |
|---|---|
| Infra | Kubernetes (AWS EKS / GCP GKE) |
| Banco | PostgreSQL managed com read replicas |
| Storage | S3 / Cloud Storage |
| Billing | Stripe |
| Esforço | ~20-30 dias de dev |
| Custo | $50-500/mês |

---

### O que preparar AGORA (sem over-engineering)

Estas decisões no MVP atual já facilitam a escala futura:

| Decisão atual | Como facilita a escala |
|---|---|
| SQLAlchemy como ORM | Abstrai o banco — SQLite→PostgreSQL é trocar 1 linha no `.env` |
| Alembic para migrations | Cuida do versionamento de schema em ambos os bancos |
| API versionada (`/api/v1`) | Permite mudanças sem quebrar clientes existentes |
| Serviços separados das rotas | Scrapers e applicators são módulos independentes — fácil de mover para workers |
| Pydantic schemas | Validação tipada já existe — multi-tenancy adiciona filtros, não reescreve queries |
| Angular standalone components | Fácil de adicionar auth guards depois |

### O que NÃO fazer agora

| Ação | Por que não |
|---|---|
| Adicionar Firebase Auth | Até ter o segundo usuário, é over-engineering |
| Migrar para PostgreSQL | Até SQLite ser gargalo real, é complexidade desnecessária |
| Adicionar Celery+Redis | Até APScheduler não aguentar, é mais pontos de falha |
| Adicionar billing | Até ter um produto que as pessoas querem pagar, é distração |

---

## Consequências

### Positivas

- **MVP entrega rápido:** Sem over-engineering, foco no que importa agora
- **Custo zero para single-user:** Oracle Cloud Free + SQLite = $0/mês
- **Path de escala claro:** Cada fase documenta o que muda, quando, e por quê
- **Fases independentes:** Não precisa completar todas — cada fase é autocontida
- **SQLAlchemy + Alembic:** Migration de banco é trivial (trocar connection string)

### Negativas

- **Multi-tenancy retroativo:** Adicionar `user_id` depois requer migration de todas as tabelas
- **Downtime na migração SQLite→PostgreSQL:** Breve interrupção necessária na Fase 1
- **Auth retrofit:** Adicionar autenticação depois requer mudanças em todas as rotas da API (middleware)

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Base de usuários cresce mais rápido que o esperado | Baixa | Alto | Fase 1 pode ser executada com urgência (~3 dias mínimo) |
| Supabase Free 500MB atingido antes do esperado | Média | Baixo | Migrar para Supabase Pro ($25/mês) ou PG self-hosted |
| Oracle Cloud Always Free muda os termos | Muito baixa | Alto | Backup do banco + Dockerfile portável = migração rápida para outro VPS |
| Firebase Auth tem limites no free tier | Muito baixa | Baixo | 10K usuários/mês é mais que suficiente para Fase 1 |

---

## Referências

- [Supabase Pricing](https://supabase.com/pricing)
- [Firebase Authentication Pricing](https://firebase.google.com/pricing)
- [Oracle Cloud Always Free](https://cloud.oracle.com/free)
- [SQLAlchemy Multi-Tenancy Patterns](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
