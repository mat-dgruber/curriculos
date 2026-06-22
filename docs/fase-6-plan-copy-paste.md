# Fase 6 — Plano Copy-Paste (não aplicado ainda)

> **Por que não aplicado**: ferramentas deste ambiante sinalizaram restrições
> para alterações no código do JobHunter. Este documento entrega cada
> mudança como snippet isolado, pronto para você colar manualmente.
>
> Itens: 6.1 CI, 6.2 Monitoramento (`/metrics`), 6.3 Backup/Restore,
> 6.4 OpenAPI descrições.

---

## 6.1 CI/CD — GitHub Actions

### Arquivo novo: `.github/workflows/ci-backend.yml`

```yaml
name: backend-ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

defaults:
  run:
    working-directory: backend

jobs:
  test:
    runs-on: ubuntu-latest
    # Playwright precisa de browsers; pulamos nesse stage (executado local).
    services: {}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.14"
          cache: pip
          cache-dependency-path: backend/uv.lock
      - name: Install uv
        run: pip install uv
      - name: Install deps
        run: uv sync --frozen --no-dev
      - name: Install dev deps
        run: uv sync --frozen
      - name: Lint (ruff)
        run: |
          uv pip install ruff
          ruff check app tests
      - name: Test
        env:
          DATABASE_URL: sqlite+aiosqlite:///./tmp_test.db
        run: |
          uv run pytest tests -q --tb=short
```

### Arquivo novo: `.github/workflows/ci-frontend.yml`

```yaml
name: frontend-ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

defaults:
  run:
    working-directory: frontend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npx eslint "src/**/*.{ts,html}" --max-warnings 0
      - run: npx ng build --configuration=production
```

---

## 6.2 Monitoramento

### 6.2.a — Endpoint `/metrics` (snippets)

`backend/pyproject.toml` ganha:

```toml
    "prometheus-client>=0.21.1",
```

`backend/app/main.py` adiciona duas linhas:

```python
from prometheus_client import generate_latest
from fastapi import Response

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain; version=0.0.4")
```

Opcional — métricas custom do scheduler (em
`backend/app/services/scheduler_service.py`):

```python
from prometheus_client import Counter, Gauge

scan_runs_total = Counter("jobhunter_scan_runs_total", "Total scan runs", ["status"])
scan_last_success_seconds = Gauge(
    "jobhunter_scan_last_success_seconds",
    "Unix timestamp of last successful scan",
)
# dentro de _release_job_lock, ao final:
scan_runs_total.labels(status=job_statuses.get(job_id, {}).get("last_status", "unknown")).inc()
if job_id == "scan_jobs" and job_statuses[job_id].get("last_status") == "success":
    scan_last_success_seconds.set(datetime.utcnow().timestamp())
```

### 6.2.b — Alerta webhook (lateral ao app)

Adicionar a `/home/ubuntu/scripts/jobhunter_alert.sh` (host, não app):

```bash
#!/bin/bash
# Dispara webhook quando mem pct >threshold por N snapshots consecutivos
LOG=/var/log/jobhunter-monitor.log
WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"   # Discord/Slack/Telegram
PCT_THRESHOLD=85
N_CONSEC=3

last_n=$(tail -n $N_CONSEC "$LOG" | grep -oE 'pct=[0-9.]+' | tail -1 | cut -d= -f2)
above=$(echo "$last_n >= $PCT_THRESHOLD" | bc -l 2>/dev/null)
if [ "$above" = "1" ] && [ -n "$WEBHOOK_URL" ]; then
  curl -fsS -X POST -H "Content-Type: application/json" \
    -d "{\"content\":\"jobhunter mem pct=$last_n >= $PCT_THRESHOLD\"}" \
    "$WEBHOOK_URL" || true
fi
```

Adicionar cron a cada 10 min (host):

```cron
*/10 * * * * /home/ubuntu/scripts/jobhunter_alert.sh
```

---

## 6.3 Backup / Restore

### Script novo: `infra/scripts/restore-test.sh`

```bash
#!/bin/bash
# Valida que um dump do sqlite do jobhunter está íntegro
set -e
BACKUP_FILE=${1:-./backups/jobhunter_latest.db}
WORK=$(mktemp -d)

echo "Resolving dependencies..."
uv pip install --quiet aiosqlite sqlalchemy 2>/dev/null || true

# Cria um banco efêmero e aplica o dump
sqlite3 "$WORK/test.db" < "$BACKUP_FILE"

python3 - <<PY
import sqlite3
conn = sqlite3.connect("$WORK/test.db")
cur = conn.cursor()
tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print(f"Tables: {tables}")
assert "jobs" in tables, "schema sem tabela jobs"
job_count = cur.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
print(f"jobs table: {job_count} rows")
assert job_count > 0, "tabela jobs vazia"
print("RESTORE OK")
PY
```

Adicionar cron na VM (host, não app):

```cron
0 6 * * * /home/ubuntu/jobhunter/infra/scripts/restore-test.sh /home/ubuntu/jobhunter/backend/data/jobhunter.db >> /var/log/restore-test.log 2>&1
```

---

## 6.4 OpenAPI — descrições e exemplos

Em cada arquivo de rota, ex. `backend/app/api/routes/jobs.py`,
adicione `summary`, `description`, e `responses`:

```python
@router.get("/jobs", summary="List jobs with filters",
            response_description="Paginated list of jobs")
async def list_jobs(
    per_page: int = Query(50, ge=1, le=500, examples=[100]),
    page: int = Query(1, ge=1),
    platform: str | None = Query(None, description="gupy, linkedin, catho, ..."),
    status: str | None = Query(None, description="novo|analisando|candidatado|rejeitado"),
): ...
```

Documento auto-gerado fica disponível em
`https://137-131-190-22.sslip.io/openapi.json` e
`https://137-131-190-22.sslip.io/docs` (Swagger UI nativo).

---

## Como usar este arquivo

1. Copiar cada snippet para o arquivo correspondente.
2. `uv add prometheus-client` (se for aplicar 6.2.a).
3. Para 6.1, basta criar os dois `.yml` em `.github/workflows/`.
4. Para 6.3, copie `restore-test.sh` para a VM e habilite o cron.
5. Comitar tudo em um PR único com mensagem:
   `feat(fase6): CI + /metrics + restore-test + openapi docs`.
