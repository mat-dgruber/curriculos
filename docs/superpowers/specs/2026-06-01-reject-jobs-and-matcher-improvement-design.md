# Design: Exclusão de Vagas + Melhoria do Matching

## Resumo

Três features interligadas:
1. **Exclusão de vagas** — deletar do banco com histórico de rejeição
2. **Matching reforçado** — scrapers + matcher otimizados para vagas mais relevantes
3. **Exclusão automática** — vagas não-favoritadas são removidas após período configurável

---

## Parte 1: Exclusão de Vagas

### Modelo: RejectedJob

Nova tabela `rejected_jobs` para armazenar histórico de vagas rejeitadas.

```python
class RejectedJob(Base):
    __tablename__ = "rejected_jobs"

    id: str (PK, UUID)
    original_job_id: str | None  # ID original antes da exclusão (nullable para jobs já deletados)
    url: str (indexed)           # URL da vaga — usada para deduplicação
    title: str
    company: str
    location: str
    platform: str
    score: int                   # Score que a vaga tinha antes de ser rejeitada
    reason: str                  # Motivo: "incompativel", "empresa_ruim", "sem_remote", "salario_baixo", "outro"
    notes: str | None            # Notas adicionais do usuário
    rejected_at: datetime
```

**Sem mudança de status** — a vaga é deletada diretamente do banco. Não adicionamos status "Descartada".

### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| DELETE | `/api/jobs/{job_id}` | Exclui vaga do banco, cria registro em `rejected_jobs` |
| POST | `/api/jobs/reject-batch` | Exclui múltiplas vagas em lote |
| GET | `/api/jobs/rejected` | Lista vagas rejeitadas (histórico) |
| PUT | `/api/jobs/rejected/{id}/reason` | Atualiza motivo de rejeição |

**DELETE /api/jobs/{job_id}** — body opcional:
```json
{
  "reason": "incompativel",
  "notes": "Não é remoto"
}
```

**POST /api/jobs/reject-batch** — body:
```json
{
  "job_ids": ["uuid1", "uuid2"],
  "reason": "incompativel",
  "notes": null
}
```

### Frontend: JobsListComponent

**Botão de excluir (por vaga):**
- Ícone de lixeira no card (ao lado do botão de favorito)
- Hover: muda cor para vermelho
- Clique: abre mini-modal/popover com dropdown de motivo + campo de notas + botão "Excluir"

**Seleção em lote (shift+click):**
- Checkbox sutil ao lado de cada vaga (aparece no hover, fica visível quando selecionado)
- Shift+click: seleciona intervalo entre último clique e este
- Botão flutuante "Excluir selecionadas (N)" aparece quando há seleção
- "Selecionar todas" na barra de filtros

**Motivos de rejeição (dropdown):**
- Incompatível com perfil
- Empresa não interessa
- Sem trabalho remoto
- Salário abaixo do esperado
- Localização incompatível
- Outro (campo de texto livre)

### Deduplicação

Quando os scrapers rodam, eles verificam a tabela `rejected_jobs` por URL:
- Se a URL já existe em `rejected_jobs`, a vaga **não** é salva novamente
- Isso evita que vagas rejeitadas reapareçam em varreduras futuras

### Exclusão de detalhes

A página de detalhes da vaga (`/jobs/:id`) também terá botão de excluir com o mesmo fluxo de motivo/notas.

---

## Parte 2: Exclusão Automática

### Lógica

Vagas que **não** são favoritas são deletadas automaticamente após um período configurável pelo usuário.

**Regras:**
- Afeta **qualquer status** (Nova, Visualizada, Candidatou) — desde que não seja favorita
- Período configurável no perfil do candidato (campo `auto_delete_days`)
- Default: 30 dias
- Vagas favoritadas **nunca** são deletadas automaticamente
- Antes de deletar, cria registro em `rejected_jobs` com motivo `"auto_delete"` (mantém histórico)
- Executado como tarefa agendada (APScheduler) junto ao scan, ou sob demanda via endpoint

**Campo no CandidateProfile:**
```python
auto_delete_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
# 0 = desativado (nunca deleta automaticamente)
```

**Scheduler:**
- Tarefa roda 1x por dia (cron `0 3 * * *` — 3h da manhã)
- Busca jobs com `is_favorite=False` e `found_at < now() - auto_delete_days`
- Para cada job: cria `RejectedJob` com motivo `"auto_delete"`, depois deleta o job
- Loga resumo: "Auto-delete: X vagas removidas"

### API

| Método | Rota | Descrição |
|--------|------|-----------|
| PUT | `/api/profile` | Atualizar `autoDeleteDays` |
| POST | `/api/jobs/auto-delete/preview` | Ver quantas vagas seriam deletadas (preview) |
| POST | `/api/jobs/auto-delete/run` | Executar auto-delete manualmente (admin/debug) |

### Frontend

- **Profile component**: campo numérico "Excluir vagas automaticamente após X dias" (0 = desativado)
- **Jobs list**: badge sutil indicando "expira em X dias" em vagas não-favoritas com mais de 75% do tempo restante

---

## Parte 3: Matching Reforçado

### Matcher Atual vs Proposto

| Componente | Atual | Proposto |
|------------|-------|----------|
| Cargo/título | 40pts (match substring) | 40pts (match substring + sinônimos) |
| Keywords | 30pts (6pts × 5 max) | 35pts (7pts × 5 max) |
| Localização | 20pts (match substring) | 15pts (match substring + "Remoto" automático) |
| Plataforma | 10pts (trusted list) | 5pts (trusted list) |
| **Penalidade** | — | **-20pts se NENHUMA keyword bater** |

**Novo: filtro de score mínimo** — vagas com score < 20 não são salvas no banco (evita lixo).

### Scrapers: Parâmetros de Busca

Atualmente os scrapers recebem `search_params` genérico. Proposta:

```python
search_params = {
    "keywords": profile.get_keywords_list(),
    "title": profile.get_target_roles_list(),      # NOVO: cargo como termo de busca
    "location": profile.get_preferred_locations_list(),  # MELHORADO: todas as localizações
    "exclude_urls": set(),  # NOVO: URLs já rejeitadas
}
```

Cada scraper adapta os parâmetros para sua plataforma:
- **LinkedIn**: busca por `title` + `keywords` + `location`
- **Gupy**: usa `keywords` como busca principal
- **Adzuna**: `what=` com `title` + `keywords`, `where=` com `location`
- **Jooble**: query combinando `title` + `keywords`
- **Remotive**: busca por `keywords` (já filtra remote por padrão)
- **InfoJobs/Catho/Vagas**: `keywords` + `location`

### Scan Service: Filtro de Rejeitados

Antes de salvar vagas no banco, o scan_service verifica:
1. URLs existentes no banco (já faz)
2. **URLs em rejected_jobs** (NOVO) — pula vagas já rejeitadas

---

## Arquivos a Criar/Modificar

### Backend
| Arquivo | Ação |
|---------|------|
| `backend/app/models/rejected_job.py` | **CRIAR** — modelo RejectedJob |
| `backend/app/models/job.py` | Sem alteração (status original mantido) |
| `backend/app/models/profile.py` | Modificar — adicionar campo `auto_delete_days` |
| `backend/app/api/routes/jobs.py` | Modificar — adicionar endpoints DELETE, reject-batch, rejected, auto-delete |
| `backend/app/services/matcher.py` | Modificar — ajustar pesos e adicionar penalidade |
| `backend/app/services/scan_service.py` | Modificar — filtrar URLs rejeitadas |
| `backend/app/services/auto_delete_service.py` | **CRIAR** — serviço de exclusão automática |
| `backend/app/services/scheduler_service.py` | Modificar — agendar tarefa de auto-delete |
| `backend/app/main.py` | Modificar — importar novo modelo |

### Frontend
| Arquivo | Ação |
|---------|------|
| `frontend/src/app/core/services/jobs.service.ts` | Modificar — adicionar deleteJob, rejectBatch, getRejected, autoDeletePreview |
| `frontend/src/app/core/models/job.model.ts` | Modificar — adicionar RejectedJob interface |
| `frontend/src/app/features/jobs/jobs-list/jobs-list.component.ts` | Modificar — checkboxes, shift+click, botão excluir, seleção em lote, badge expiração |
| `frontend/src/app/features/jobs/job-detail/job-detail.component.ts` | Modificar — botão de excluir na página de detalhes |
| `frontend/src/app/features/profile/profile.component.ts` | Modificar — campo autoDeleteDays |

### Testes
| Arquivo | Ação |
|---------|------|
| `backend/tests/test_rejected_jobs.py` | **CRIAR** — testes do modelo e endpoints |
| `backend/tests/test_auto_delete.py` | **CRIAR** — testes do serviço de auto-delete |
| `backend/tests/test_matcher.py` | Modificar — testar novos pesos e penalidade |
| `backend/tests/test_scrapers.py` | Modificar — testar filtro de URLs rejeitadas |
