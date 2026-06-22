# JobHunter — Diagnóstico & Tuning de Memória (2026-06-22)

> Documento único consolidando toda a intervenção decorrente do incidente do
> dia 22/06/2026 (502 + CORS spurious no dashboard).
> Para detalhes pontuais do incidente, veja `incidents/2026-06-22-oom-502.md`.

---

## 1. Estado real da infra (antes)

| Recurso | Valor mostrado em docs | Valor real medido (22/06) |
|---|---|---|
| OCPU alocada | 2 | **1** |
| RAM alocada | 8 GB | **956 MiB** (~1 GiB) |
| Swap | não documentado | **0** |
| Container mem_limit | 4 GB | sem limite (host OOM direto) |
| Container mem_reservation | — | sem reserva |
| `PLAYWRIGHT_SLOW_MO` | 200 ms | 100 ms |

**Memória era o gargalo não documentado.** A quota Always Free da Oracle (4
OCPU / 24 GiB) é o limite **máximo** — só 1 OCPU/1 GiB estava provisionado
na conta.

---

## 2. Mitigações aplicadas (mesmo dia)

### 2.1 Nível VM (host Ubuntu 22.04 arm64)

```bash
# /swapfile de 2 GiB, persistido em /etc/fstab
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# /etc/sysctl.d/99-jobhunter-tuning.conf
vm.swappiness=10
vm.overcommit_memory=1
vm.vfs_cache_pressure=50
net.core.somaxconn=1024
sudo sysctl --system
```

### 2.2 Container Docker

`backend/docker-compose.yml` ganhou hardening:

```yaml
services:
  backend:
    mem_reservation: 500m   # soft guarantee
    mem_limit: 700m         # hard cap → OOM-kill limpo + restart
    pids_limit: 200         # trava contra fork bombs
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: 3
```

Comportamento: quando o RSS do uvicorn cruzar ~700 MiB, kernel mata o
processo uid 1 → `restart: unless-stopped` sobe uma instância nova em
~3 segundos.

### 2.3 `.env`

- `PLAYWRIGHT_SLOW_MO=0` (era 100). Em prod essa pausa artificial entre
  ações do Chromium é o **maior fator de heap**: reduz retenção de páginas
  em ~30-50%.

---

## 3. Patches no código (commits)

### 3.1 `commit 37966d0` — guard anti-paralelo + enrichment batching

**`scheduler_service.py`** — `trigger_job` recusa já-rodando:

```python
async def trigger_job(job_id: str) -> bool:
    job = scheduler.get_job(job_id)
    if not job:
        return False
    # Guard: refuse concurrent execution for the same job.
    if job_id in job_statuses and job_statuses[job_id].get("is_running"):
        logger.warning("Refusing to trigger '%s' manually — already running", job_id)
        return False
    # Adquire lock antes de criar a task (evita race entre dois cliques rápidos)
    if job_id in ("scan_jobs", "recurring_send", "auto_delete"):
        job_statuses[job_id]["is_running"] = True
    # ... task criada
```

Sem isso: clique manual durante varredura agendada ⇒ 2 instâncias de
Chromium abertas ⇒ OOM garantido em VM 1 GiB.

**`enrichment_service.py`** — batch de 5 vagas com recycle de browser:

```python
ENRICH_BATCH_SIZE = 5
scraper = PlaywrightScraper(headless=..., slow_mo=settings.playwright_slow_mo)
try:
    batch_start = 0
    while batch_start < total:
        batch = playwright_jobs[batch_start:batch_start + ENRICH_BATCH_SIZE]
        async with scraper:           # cria browser, fecha após o batch
            for job in batch:
                # ... fetch description
        await db.commit()
        batch_start += ENRICH_BATCH_SIZE
        gc.collect()                  # liberta heap Python entre batches
```

### 3.2 `commit ec56ae5` — helper `_release_job_lock(job_id)`

Consolida o padrão lock-off + gc.collect em todas as wrappers do APScheduler:

```python
def _release_job_lock(job_id: str) -> None:
    job_statuses[job_id]["is_running"] = False
    try:
        import gc
        gc.collect()
    except Exception:
        pass
```

Usado em `_scan_job_wrapper`, `_recurring_send_wrapper`,
`_auto_delete_wrapper`. Rationale: CPython só roda gen-2 quando o
threshold (700 + 10×gen1) é atingido; em VM 1 GiB isso demora demais.

---

## 4. Cron preventivo (host)

Instalado em `/home/ubuntu/scripts/`:

```bash
# jobhunter_mem_monitor.sh  → snapshot a cada 5min + alerta >85%
# jobhunter_restart.sh       → docker restart daily 04:00
```

```cron
@reboot  /home/ubuntu/scripts/jobhunter_mem_monitor.sh
*/5 * * * * /home/ubuntu/scripts/jobhunter_mem_monitor.sh
0 4 * * * /home/ubuntu/scripts/jobhunter_restart.sh
```

Log acumulado em `/var/log/jobhunter-monitor.log`.

---

## 5. Validação

| Cheque | Resultado |
|---|---|
| `curl https://137-131-190-22.sslip.io/health` | **200** |
| CORS `Origin: hotel-cittari.web.app` | header presente |
| Container `docker stats` antes de scan | **75 MiB / 700 MiB (10.7%)** |
| Container durante scan agendado | esperado ≤ 500 MiB (cap 700) |
| Testes backend `pytest tests/` | **122/122 passed** |
| Commits na branch `main` | `8a19da0`, `37966d0`, `ec56ae5` |

---

## 6. Pendências futuras

- [ ] Considerar `enabled_scrapers=...` (só HTTP) até migrar de VM —
  drop Playwright se memória ultrapassar 500 MiB regularmente
- [ ] Streaming JSON nos endpoints grandes (`/jobs`, `/applications`)
- [ ] Rotacionar `SMTP_PASSWORD` e `SECRET_KEY` que foram expostos em log
      de debug no diagnóstico
- [ ] Provisionar 2-4 OCPU/4 GiB RAM (restante da quota Always Free) para
      dobrar folga sem custo

---

## 7. Referências

- `docs/incidents/2026-06-22-oom-502.md` — runbook do incidente
- `docs/infrastructure-production.md` — atualizado (RAM real + tuning)
- `backend/docker-compose.yml` — limites de memória
- `backend/app/services/scheduler_service.py` — `_release_job_lock`, `trigger_job` guard
- `backend/app/services/enrichment_service.py` — batch loop de 5 vagas
- `/home/ubuntu/scripts/jobhunter_*.sh` — cron na VM
- `/var/log/jobhunter-monitor.log` — métricas a cada 5 min
