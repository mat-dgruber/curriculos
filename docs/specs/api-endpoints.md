# Specs — API Endpoints (FastAPI)

## Convenções Gerais

- Base URL: `http://localhost:8000` (dev) / URL de produção
- Todas as rotas usam `async/await`
- Respostas de erro seguem formato padrão: `{ "detail": "mensagem" }`
- Validação de request body via **Pydantic models**
- CORS configurado apenas para `http://localhost:4200` (dev)
- Prefixo global: `/api/v1` (versionamento)

---

## Jobs (Vagas)

### GET /api/v1/jobs

Lista vagas encontradas com filtros opcionais.

**Query Parameters:**
| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `search` | string | `""` | Busca por título ou empresa |
| `min_score` | int | `0` | Score mínimo de compatibilidade (0-100) |
| `platform` | string | `""` | Filtrar por plataforma (linkedin, gupy, vagas) |
| `status` | string | `""` | Filtrar por status (Nova, Visualizada, Candidatou) |
| `page` | int | `1` | Página |
| `per_page` | int | `20` | Itens por página |
| `sort_by` | string | `"found_at"` | Campo de ordenação (found_at, score, title) |
| `sort_order` | string | `"desc"` | Ordem (asc, desc) |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Desenvolvedor Angular Sênior",
      "company": "Tech Corp",
      "location": "São Paulo, SP (Remoto)",
      "platform": "linkedin",
      "url": "https://linkedin.com/jobs/...",
      "description": "...",
      "score": 85,
      "status": "Nova",
      "found_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/jobs?min_score=70&platform=linkedin&page=1"
```

---

### GET /api/v1/jobs/{id}

Detalhes de uma vaga específica.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | UUID | ID da vaga |

**Response 200:**
```json
{
  "id": "uuid",
  "title": "Desenvolvedor Angular Sênior",
  "company": "Tech Corp",
  "location": "São Paulo, SP (Remoto)",
  "platform": "linkedin",
  "url": "https://linkedin.com/jobs/...",
  "description": "Buscamos dev Angular com 5+ anos...",
  "requirements": ["Angular 15+", "TypeScript", "RxJS"],
  "salary_range": "R$ 12.000 - R$ 18.000",
  "score": 85,
  "status": "Nova",
  "found_at": "2025-01-15T10:30:00Z",
  "application": null
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Vaga não encontrada |

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000"
```

---

### POST /api/v1/jobs/scan

Dispara varredura manual de vagas. Retorna imediatamente (202 Accepted) e executa em background.

**Request Body:** Nenhum

**Response 202:**
```json
{
  "message": "Varredura iniciada em background",
  "job_id": "scan-uuid",
  "status": "running"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 409 | Varredura já em execução |
| 500 | Falha ao iniciar job |

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/jobs/scan"
```

---

## Applications (Candidaturas)

### GET /api/v1/applications

Lista candidaturas com filtros opcionais.

**Query Parameters:**
| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `status` | string | `""` | Filtrar por status |
| `date_from` | string | `""` | Data início (ISO 8601) |
| `date_to` | string | `""` | Data fim (ISO 8601) |
| `is_recurring` | bool | `null` | Filtrar por recorrente/único |
| `page` | int | `1` | Página |
| `per_page` | int | `20` | Itens por página |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "job_title": "Desenvolvedor Angular Sênior",
      "company_name": "Tech Corp",
      "status": "Enviado",
      "sent_at": "2025-01-15T14:00:00Z",
      "is_recurring": false,
      "screenshot_path": "/storage/screenshots/2025-01-15_14-00.png",
      "error_message": null
    }
  ],
  "total": 15,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/applications?status=Enviado&date_from=2025-01-01"
```

---

### POST /api/v1/applications

Cria uma nova candidatura (manual ou automática).

**Request Body:**
```json
{
  "job_id": "uuid",
  "notes": "Candidatura manual via painel"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "job_id": "uuid",
  "job_title": "Desenvolvedor Angular Sênior",
  "company_name": "Tech Corp",
  "status": "Pendente",
  "sent_at": null,
  "is_recurring": false,
  "screenshot_path": null,
  "error_message": null,
  "created_at": "2025-01-15T14:00:00Z"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Job não encontrado |
| 409 | Candidatura já existe para este job |
| 422 | Dados inválidos (Pydantic validation) |

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/applications" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

---

### PUT /api/v1/applications/{id}/status

Atualiza o status de uma candidatura.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | UUID | ID da candidatura |

**Request Body:**
```json
{
  "status": "Enviado",
  "notes": "Enviado com sucesso via automação"
}
```

**Status válidos:**
- `Pendente` → `Enviado` | `Falhou` | `Arquivado`
- `Enviado` → `Arquivado` (fluxo unidirecional)
- `Falhou` → `Pendente` (retry) | `Arquivado`

**Response 200:**
```json
{
  "id": "uuid",
  "status": "Enviado",
  "updated_at": "2025-01-15T14:05:00Z"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Candidatura não encontrada |
| 409 | Transição de status inválida (ex: Enviado → Pendente) |
| 422 | Status inválido |

**Exemplo:**
```bash
curl -X PUT "http://localhost:8000/api/v1/applications/550e8400/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "Enviado"}'
```

---

## Companies (Empresas Fixas)

### GET /api/v1/companies

Lista empresas fixas cadastradas.

**Query Parameters:**
| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `status` | string | `""` | Filtrar por status (Ativo, Pausado, Respondeu) |
| `page` | int | `1` | Página |
| `per_page` | int | `20` | Itens por página |

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Banco XYZ",
      "application_url": "https://bancoxyz.com.br/trabalhe-conosco",
      "status": "Ativo",
      "is_active": true,
      "interval_days": 30,
      "last_sent_at": "2025-01-01T10:00:00Z",
      "next_send_at": "2025-02-01T10:00:00Z",
      "total_sent": 3,
      "created_at": "2024-10-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/companies?status=Ativo"
```

---

### POST /api/v1/companies

Cadastra uma nova empresa fixa.

**Request Body:**
```json
{
  "name": "Banco XYZ",
  "application_url": "https://bancoxyz.com.br/trabalhe-conosco",
  "interval_days": 30,
  "notes": "Formulário simples, aceita PDF direto"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Banco XYZ",
  "application_url": "https://bancoxyz.com.br/trabalhe-conosco",
  "status": "Ativo",
  "is_active": true,
  "interval_days": 30,
  "last_sent_at": null,
  "next_send_at": "2025-02-01T10:00:00Z",
  "total_sent": 0,
  "created_at": "2025-01-15T00:00:00Z"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 422 | Dados inválidos (URL inválida, nome vazio) |

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/companies" \
  -H "Content-Type: application/json" \
  -d '{"name": "Banco XYZ", "application_url": "https://bancoxyz.com.br/trabalhe-conosco", "interval_days": 30}'
```

---

### PUT /api/v1/companies/{id}

Atualiza dados de uma empresa fixa.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | UUID | ID da empresa |

**Request Body (parcial):**
```json
{
  "name": "Banco XYZ Atualizado",
  "interval_days": 15
}
```

**Response 200:** Empresa atualizada (mesmo schema do GET)

**Erros:**
| Status | Condição |
|---|---|
| 404 | Empresa não encontrada |
| 422 | Dados inválidos |

**Exemplo:**
```bash
curl -X PUT "http://localhost:8000/api/v1/companies/550e8400" \
  -H "Content-Type: application/json" \
  -d '{"interval_days": 15}'
```

---

### DELETE /api/v1/companies/{id}

Remove uma empresa fixa.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | UUID | ID da empresa |

**Response 200:**
```json
{
  "message": "Empresa removida com sucesso",
  "id": "uuid"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Empresa não encontrada |

**Exemplo:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/companies/550e8400"
```

---

### PUT /api/v1/companies/{id}/toggle

Pausa ou ativa envio recorrente de uma empresa.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | UUID | ID da empresa |

**Response 200:**
```json
{
  "id": "uuid",
  "is_active": false,
  "status": "Pausado",
  "message": "Envio recorrente pausado"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Empresa não encontrada |
| 409 | Empresa já tem status "Respondeu" (não pode ser reativada) |

**Exemplo:**
```bash
curl -X PUT "http://localhost:8000/api/v1/companies/550e8400/toggle"
```

---

## Profile (Perfil do Candidato)

### GET /api/v1/profile

Retorna o perfil do candidato.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Matheus Diniz",
  "email": "matheus@email.com",
  "phone": "+55 11 99999-0000",
  "location": "São Paulo, SP",
  "target_role": "Desenvolvedor Angular/Python",
  "linkedin_url": "https://linkedin.com/in/matheusdiniz",
  "cv_filename": "curriculo_matheus.pdf",
  "cv_uploaded_at": "2025-01-10T00:00:00Z",
  "keywords": ["angular", "python", "typescript", "fastapi"],
  "target_roles": ["Desenvolvedor Frontend", "Desenvolvedor Full Stack"],
  "preferred_locations": ["São Paulo", "Remoto"],
  "scan_interval_hours": 6,
  "auto_apply": false,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T00:00:00Z"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Perfil não encontrado (primeiro acesso) |

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/profile"
```

---

### PUT /api/v1/profile

Atualiza dados do perfil.

**Request Body (parcial):**
```json
{
  "name": "Matheus Diniz",
  "email": "matheus@email.com",
  "target_role": "Desenvolvedor Angular/Python",
  "location": "São Paulo, SP",
  "keywords": ["angular", "python", "typescript", "fastapi", "playwright"],
  "scan_interval_hours": 12,
  "auto_apply": true
}
```

**Response 200:** Perfil atualizado (mesmo schema do GET)

**Erros:**
| Status | Condição |
|---|---|
| 422 | Dados inválidos |

**Exemplo:**
```bash
curl -X PUT "http://localhost:8000/api/v1/profile" \
  -H "Content-Type: application/json" \
  -d '{"scan_interval_hours": 12}'
```

---

### POST /api/v1/profile/cv

Upload do currículo em PDF.

**Request:** `multipart/form-data`

| Campo | Tipo | Descrição |
|---|---|---|
| `file` | File | PDF do currículo (max 10MB) |

**Response 200:**
```json
{
  "message": "Currículo atualizado com sucesso",
  "filename": "curriculo_matheus.pdf",
  "size_bytes": 245760,
  "uploaded_at": "2025-01-15T14:00:00Z"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 400 | Arquivo não é PDF |
| 413 | Arquivo excede 10MB |
| 422 | Nenhum arquivo enviado |

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/profile/cv" \
  -F "file=@curriculo.pdf"
```

---

## Scheduler (Agendador)

### GET /api/v1/scheduler/status

Retorna status atual dos jobs agendados.

**Response 200:**
```json
{
  "is_running": true,
  "jobs": [
    {
      "id": "scan_jobs",
      "name": "Varredura de vagas",
      "next_run": "2025-01-15T18:00:00Z",
      "last_run": "2025-01-15T12:00:00Z",
      "last_status": "success",
      "trigger": "interval[hours: 6]"
    },
    {
      "id": "recurring_send",
      "name": "Envio recorrente empresas fixas",
      "next_run": "2025-02-01T10:00:00Z",
      "last_run": "2025-01-01T10:00:00Z",
      "last_status": "success",
      "trigger": "cron[day: 1, hour: 10]"
    }
  ],
  "paused_until": null
}
```

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/scheduler/status"
```

---

### POST /api/v1/scheduler/trigger/{job_id}

Dispara manualmente um job específico.

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `job_id` | string | ID do job (scan_jobs ou recurring_send) |

**Response 202:**
```json
{
  "message": "Job disparado manualmente",
  "job_id": "scan_jobs",
  "status": "running"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 404 | Job não encontrado |
| 409 | Job já em execução |

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/scheduler/trigger/scan_jobs"
```

---

### PUT /api/v1/scheduler/pause

Pausa global do agendador (férias, processos em andamento).

**Request Body:**
```json
{
  "pause_until": "2025-02-01T00:00:00Z"
}
```

**Response 200:**
```json
{
  "message": "Agendador pausado até 2025-02-01",
  "paused_until": "2025-02-01T00:00:00Z"
}
```

**Erros:**
| Status | Condição |
|---|---|
| 422 | Data inválida (no passado) |

**Exemplo:**
```bash
curl -X PUT "http://localhost:8000/api/v1/scheduler/pause" \
  -H "Content-Type: application/json" \
  -d '{"pause_until": "2025-02-01T00:00:00Z"}'
```

---

### DELETE /api/v1/scheduler/pause

Retoma o agendador (remove pausa).

**Response 200:**
```json
{
  "message": "Agendador retomado",
  "is_running": true
}
```

**Exemplo:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/scheduler/pause"
```

---

## Resumo de Status Codes

| Código | Uso |
|---|---|
| 200 | Sucesso (GET, PUT) |
| 201 | Criado (POST) |
| 202 | Aceito em background (scan, trigger) |
| 400 | Request inválido |
| 404 | Recurso não encontrado |
| 409 | Conflito (estado inválido, duplicata) |
| 413 | Payload muito grande (upload > 10MB) |
| 422 | Validação Pydantic falhou |
| 500 | Erro interno do servidor |
