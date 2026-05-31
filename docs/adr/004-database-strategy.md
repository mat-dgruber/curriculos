# ADR-004: Banco de Dados

## Status
Accepted

## Contexto

O JobHunter é uma ferramenta pessoal de automação de candidaturas a vagas de emprego. O sistema armazena dados sensíveis do usuário (CPF, endereço, histórico profissional, currículo em PDF) e precisa persistir vagas encontradas, candidaturas enviadas e empresas fixas recorrentes. Inicialmente single-user, mas com potencial de escalar para múltiplos usuários no futuro.

As decisões de banco de dados precisam cobrir: escolha do banco para dev vs produção, ORM, migrations, armazenamento de arquivos (PDF e screenshots), conformidade com LGPD, e estratégia de escala.

---

## Decisão

### 1. SQLite para desenvolvimento e uso pessoal

SQLite será o banco de dados padrão para ambiente de desenvolvimento e uso pessoal. Zero configuração, banco em arquivo único (`./jobhunter.db`), sem necessidade de servidor externo. Suficiente para operação single-user com volume moderado de dados.

```env
DATABASE_URL=sqlite:///./jobhunter.db
```

### 2. PostgreSQL para produção e multi-user

Quando o sistema escalar para múltiplos usuários, migração para PostgreSQL via Railway PostgreSQL addon ou provedor equivalente. O SQLAlchemy abstrai a diferença de dialeto — código de models e serviços não muda.

```env
DATABASE_URL=postgresql://user:pass@host:5432/jobhunter
```

### 3. SQLAlchemy 2.x como ORM

SQLAlchemy 2.x com suporte async (`AsyncSession`) para todas as operações de banco. Integração nativa com Pydantic para schemas de request/response. Uma única abordagem de ORM para SQLite e PostgreSQL.

### 4. Alembic para migrations

Alembic gerencia versionamento de schema com migrations incrementais. Suporte a rollback (`alembic downgrade`). Todas as mudanças de schema passam por migration — alteração direta de tabelas é proibida.

### 5. Seed data para desenvolvimento

Script de seed popula o banco com dados fake para permitir desenvolvimento do frontend sem scraping real:
- 3 vagas de exemplo (diferentes plataformas e scores)
- 2 candidaturas (diferentes status)
- 1 empresa fixa (status Ativo)

### 6. Conformidade com LGPD

Dados pessoais do candidato ficam armazenados exclusivamente no banco próprio do JobHunter. Nunca compartilhados com terceiros além das plataformas de destino (LinkedIn, Gupy, etc.) onde o candidato se candidata. O PDF do currículo nunca é exposto em URL pública — servido via endpoint autenticado (`GET /profile/cv`).

### 7. Armazenamento de PDFs

Currículos em PDF salvos em `./storage/cv/` com nome do arquivo sendo o hash SHA-256 do conteúdo. Vantagens:
- Evita conflitos de filename
- Permite deduplicação (mesmo arquivo = mesmo hash)
- Caminho relativo salvo no perfil do candidato

### 8. Armazenamento de screenshots

Screenshots de evidência de envio salvos em `./storage/screenshots/` com timestamp no nome (ex: `2025-01-15_14-00-35.png`). Cada tentativa de envio (sucesso ou falha) gera screenshot como evidência auditável.

### 9. Índices para performance

Campos frequentemente consultados recebem índices:

**Tabela `jobs`:**
- `status` — filtros por status de vaga
- `score` — ordenação e filtro por compatibilidade
- `found_at` — ordenação cronológica
- `platform` — filtros por plataforma

**Tabela `applications`:**
- `status` — filtros por status de candidatura
- `sent_at` — filtros por data de envio
- `is_recurring` — separar envios únicos de recorrentes

**Tabela `fixed_companies`:**
- `is_active` — filtrar empresas ativas para job mensal
- `next_send_at` — agendamento de envio recorrente

### 10. Constraints de status via CHECK

O banco de dados valida valores de status via CHECK constraints, garantindo integridade mesmo se o código tiver bugs:

```sql
-- Jobs
CHECK (status IN ('Nova', 'Visualizada', 'Candidatou', 'Arquivado'))

-- Applications
CHECK (status IN ('Pendente', 'Enviado', 'Falhou', 'Arquivado'))

-- Fixed Companies
CHECK (status IN ('Ativo', 'Pausado', 'Respondeu'))
```

A regra de negócio de fluxo unidirecional de candidaturas (Pendente → Enviado, nunca de volta) é enforceada na camada de serviço, não no banco — pois o banco permite retry (Falhou → Pendente).

### 11. Audit trail (trilha de auditoria)

A tabela `applications` funciona como log de auditoria completo:
- Timestamp de criação (`created_at`)
- Timestamp de envio (`sent_at`)
- Status atual e anterior
- Caminho do screenshot de evidência
- Mensagem de erro (quando falha)
- Flag de recorrência (`is_recurring`)

Registros são append-only — nunca deletados. Registros antigos podem ser arquivados (status `Arquivado`) mas nunca removidos.

### 12. Path de escala futuro

A migração SQLite → PostgreSQL não exige mudanças de código em models ou serviços:
1. SQLAlchemy abstrai o dialeto do banco
2. Alembic gerencia diferenças de schema entre dialetos
3. Apenas a `DATABASE_URL` no `.env` muda
4. Testes rodam em SQLite, produção em PostgreSQL

---

## Consequências

### Positivas

- **Zero config no dev:** SQLite não exige setup — `uv run uvicorn app.main:app` já funciona
- **Path claro de escala:** SQLite → PostgreSQL é uma troca de connection string, não de código
- **Type safety:** SQLAlchemy + Pydantic garantem que dados entram e saem tipados
- **Auditoria completa:** Cada envio é rastreável com timestamp, status e evidência visual
- **LGPD compliant:** Dados ficam no banco próprio, PDF nunca exposto publicamente
- **Rollback suportado:** Alembic permite reverter migrations se algo der errado em produção

### Negativas

- **SQLite limitações:** Não suporta múltiplos writers simultâneos (ok para single-user, problemático para multi-user)
- **Performance de índice:** SQLite tem performance inferior a PostgreSQL em queries complexas com muitos índices
- **Seed data maintenance:** Dados fake precisam ser atualizados quando o schema muda
- **Dois ambientes:** Diferenças sutis entre SQLite e PostgreSQL podem causar bugs difíceis de detectar em dev

### Riscos

- **Corrupção de SQLite:** Arquivo `.db` pode corromper em caso de crash — backups periódicos são recomendados
- **Migração de dados:** Quando escalar para PostgreSQL, dados existentes precisam ser migrados (script de dump/restore)
- **Storage path:** Paths relativos (`./storage/`) funcionam local mas precisam de ajuste em containers Docker
- **Screenshots em produção:** Em VPS com filesystem efêmero (ex: Railway), screenshots precisam de storage persistente (S3 ou volume)
