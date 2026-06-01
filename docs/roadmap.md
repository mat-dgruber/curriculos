# Roadmap — JobHunter

> Status atual: **MVP Phase 1-5 completo** | **95 testes backend** | Frontend funcional
>
> Atualizado: 2026-06-01

---

## Legenda de Status

| Icone | Significado |
|-------|-------------|
| `[COMPLETO]` | Implementado e testado |
| `[EM PROGRESSO]` | Parcialmente implementado |
| `[STUB]` | Endpoint/componente existe mas não funcional |
| `[PENDENTE]` | Planejado, não implementado |
| `[BUG]` | Comportamento incorreto identificado |

---

## FASE 1 — Corrigir Stubs e Bugs Críticos (Prioridade: ALTA)

### 1.1 Upload de CV — `[COMPLETO]`
- **Arquivo:** `backend/app/api/routes/profile.py`
- **Implementado:** Salva em `storage/cv/{profile_id}.pdf`, valida MIME (PDF) e tamanho (10MB), atualiza `cv_filename` e `cv_uploaded_at` no banco
- **Testes:** 3 novos testes (upload OK, rejeita non-PDF 415, rejeita >10MB 413)

### 1.2 JobDetailComponent — `[COMPLETO]`
- **Arquivo:** `frontend/src/app/features/jobs/job-detail/job-detail.component.ts`
- **Implementado:** Busca por ID via `JobsService.getJob()`, exibe detalhes completos, ScoreBadge, StatusChip, botão "Candidatar-se", skeleton loading, erro, link externo

### 1.3 Upload de CV no Backend — `[COMPLETO]`
- **Implementado:** Integrado com item 1.1 (mesmo endpoint)

### 1.4 DELETE para candidaturas — `[COMPLETO]`
- **Arquivo:** `backend/app/api/routes/applications.py`
- **Implementado:** DELETE lógico (status → "Arquivado"), retorna 409 se já arquivado, 404 se não encontrado
- **Testes:** 3 novos testes (archive OK, já arquivado 409, não encontrado 404)

---

## FASE 2 — Manutenção de Código (Prioridade: ALTA)

### 2.1 ProfileComponent `as any` — `[COMPLETO]`
- **Arquivo:** `frontend/src/app/features/profile/profile.component.ts`
- **Corrigido:** `updateField` agora usa `keyof CandidateProfileUpdate`, `saveProfile` tipado sem `as any`

### 2.2 pdf_handler.py — `[COMPLETO]`
- **Arquivo:** `backend/app/utils/pdf_handler.py`
- **Implementado:** `extract_text_from_pdf()` e `extract_text_from_bytes()` via pdfplumber
- **Dependência:** `pdfplumber>=0.11.0` adicionada ao `pyproject.toml`

### 2.3 Falta `core/deps.py` — `[DECIDIDO]`
- **Decisão:** Manter `get_db` em `database.py` (simplificado). A documentação foi atualizada para refletir isso.

### 2.4 Alembic Migrations — `[COMPLETO]`
- **Configurado:** `alembic/env.py` corrigido para importar todos os models e usar `settings.database_url`
- **Migração:** `create_all` removido do startup, substituído por nota sobre `alembic upgrade head`
- **Uso:** `alembic upgrade head` para aplicar, `alembic revision --autogenerate` para novas migrations

---

## FASE 3 — Expandir Scrapers (Prioridade: MÉDIA)

### 3.1 LinkedIn API Oficial — `[PENDENTE]`
- **Problema:** Scraping via Playwright é frágil e pode ser bloqueado
- **Alternativa:** LinkedIn API (limitada, veja seção de APIs abaixo)
- **Decisão:** Manter Playwright como fallback, adicionar API quando disponível

### 3.2 Novas Fontes de Vagas — `[EM PROGRESSO]`
| Fonte | Método | Custo | Status |
|-------|--------|-------|--------|
| Gupy | HTTP API pública | Grátis | `[COMPLETO]` |
| Vagas.com | Playwright scraping | Grátis | `[COMPLETO]` |
| LinkedIn | Playwright scraping | Grátis (frágil) | `[COMPLETO]` |
| Adzuna | REST API | Grátis (500 req/mês) | `[COMPLETO]` |
| Jooble | REST API | Grátis (ilimitado) | `[COMPLETO]` |
| Remotive | REST API | Grátis (ilimitado) | `[PENDENTE]` |
| Indeed | Sem API pública | — | `[NÃO VIÁVEL]` |
| InfoJobs | REST API | Grátis (limitado) | `[PENDENTE]` |
| Catho | Scraping | Grátis | `[PENDENTE]` |

### 3.3 Normalização de Dados entre Fontes — `[COMPLETO]`
- Schema unificado: `ScrapedJob` DTO em `base_scraper.py`
- Campos normalizados: `title`, `company`, `location`, `description`, `url`, `platform`, `salary_range`, `requirements`
- Todos os scrapers retornam `list[ScrapedJob]`
- Integrado no `scan_service.py` com contagem por plataforma

---

## FASE 4 — Sistema B2B: Empresas + Candidatos (Prioridade: MÉDIA)

> Detalhado em `docs/future-features.md`

### 4.1 Cadastro de Empresas — `[PENDENTE]`
- Fluxo de registro: email + senha + dados da empresa
- Perfil empresarial: nome, CNPJ, setor, tamanho, site
- Dashboard empresarial para gerenciar vagas

### 4.2 Publicação de Vagas por Empresas — `[PENDENTE]`
- CRUD completo de vagas pelas empresas
- Campos: título, descrição, requisitos, salário, localização, tipo (CLT/PJ/Estágio)
- Status da vaga: Aberta, Pausada, Encerrada

### 4.3 Busca de Vagas por Candidatos — `[PENDENTE]`
- Página pública de busca de vagas (sem login necessário)
- Filtros: cargo, localização, salário, tipo, empresa
- Score de compatibilidade com perfil do candidato
- Botão "Candidatar-se" direto na busca

### 4.4 Autenticação — `[PENDENTE]`
- Firebase Authentication (conforme ADR-005)
- Dois tipos de conta: Candidato e Empresa
- JWT tokens para API
- Guards no Angular

### 4.5 Multi-tenancy — `[PENDENTE]`
- Adicionar `user_id` em todas as tabelas
- Isolamento de dados por usuário/empresa
- Migração SQLite → Supabase PostgreSQL (conforme ADR-005)

---

## FASE 5 — Melhorias de UX (Prioridade: BAIXA)

### 5.1 Dashboard com Gráficos — `[PENDENTE]`
- Gráfico de candidaturas por semana/mês
- Timeline de atividades
- Score médio das vagas encontradas
- Taxa de resposta das empresas

### 5.2 Notificações In-App — `[PENDENTE]`
- Snackbar/toast para feedback de ações
- Badge de notificações no header
- Centro de notificações com histórico

### 5.3 Modo Escuro/Claro — `[PENDENTE]`
- Toggle no header ou settings
- Salvar preferência no localStorage
- CSS variables para tema

### 5.4 PWA (Progressive Web App) — `[PENDENTE]`
- Service worker para offline
- Push notifications
- Ícone e splash screen

### 5.5 Responsividade Mobile — `[PENDENTE]`
- Sidebar colapsável em mobile
- Layout adaptativo para telas < 768px
- Touch gestures para navegação

---

## FASE 6 — Infraestrutura e Deploy (Prioridade: MÉDIA)

### 6.1 CI/CD Completo — `[EM PROGRESSO]`
- pytest no GitHub Actions ✅
- Build Angular no GitHub Actions ✅
- Deploy Firebase Hosting ✅
- Deploy Docker no Oracle VM ✅
- Falta: lint (ruff/eslint), type check (mypy/pyright)

### 6.2 Monitoramento — `[PENDENTE]`
- Health check endpoint `/health`
- Métricas básicas (requests/s, latency)
- Alertas de erro (email ou webhook)
- Log rotation no Docker

### 6.3 Backup Automatizado — `[EM PROGRESSO]`
- Crontab diário 3AM ✅
- Retenção 30 dias ✅
- Falta: sync para Oracle Object Storage
- Falta: teste de restore automático

### 6.4 Documentação da API (OpenAPI/Swagger) — `[PENDENTE]`
- FastAPI já gera `/docs` automaticamente
- Falta: descrições detalhadas nos schemas
- Falta: exemplos de request/response
- Falta: autenticação documentada

---

## FASE 7 — IA e Automação Avançada (Prioridade: BAIXA)

### 7.1 Matching com LLM — `[PENDENTE]`
- Usar modelo local ou API para analisar compatibilidade vaga-perfil
- Considerar experiência, skills, localização, cultura
- Score mais preciso que palavras-chave

### 7.2 Geração Automática de Cover Letter — `[PENDENTE]`
- Gerar carta de apresentação personalizada por vaga
- Baseada no perfil + descrição da vaga
- Export em PDF

### 7.3 Análise de Mercado — `[PENDENTE]`
- Salário médio por cargo e localização
- Tendências de hiring
- Empresas com mais vagas abertas

### 7.4 Anti-Detecção — `[PENDENTE]`
- Rate limiting inteligente
- Rotação de user agents
- Delays aleatórios entre requests
- Retry com backoff exponencial

---

## Resumo de Prioridades

| Fase | Itens | Esforço Estimado | Impacto |
|------|-------|-------------------|---------|
| 1 — Stubs e Bugs | 4 | 3-5 dias | Crítico |
| 2 — Manutenção | 4 | 2-3 dias | Alto |
| 3 — Scrapers | 3 | 5-8 dias | Médio |
| 4 — B2B | 5 | 15-20 dias | Transformador |
| 5 — UX | 5 | 8-12 dias | Médio |
| 6 — Infra | 4 | 3-5 dias | Alto |
| 7 — IA | 4 | 10-15 dias | Inovador |

**Total estimado:** 46-68 dias de desenvolvimento
