---
name: Scheduler guard anti-parcial + gc.collect ao final do job
description: Padrão obrigatório em wrappers do APScheduler: lock anti-concorrência + gc.collect() best-effort em finally — crítico em VM 1 GiB porque CPython retém heap gen-2 entre ticks.
type: feedback
---

**Regra:** Todo wrapper assíncrono de job do APScheduler em `scheduler_service.py` deve:

1. **Conferir e adquirir lock antes de criar a task** quando há também um trigger manual exposto via `trigger_job(job_id)` — caso contrário, dois cliques rápidos podem disparar dois Playwrights simultâneos.
2. **Liberar o lock + chamar `gc.collect()` no finally** via helper único (ex: `_release_job_lock(job_id)`) — substitui o `job_statuses[job_id]["is_running"] = False` direto.

**Why:** Em 2026-06-22 o container `jobhunter` travou por OOM após varredura. Identificou-se que:
- CPython só dispara gen-2 GC quando threshold atingido — entre ticks do APScheduler,Playwright pages, sessões de DB e plays list ficam no heap por minutos.
- Sem guard em `trigger_job`, era possível clique manual durante scan agendado criar dois Chromium simultaneamente (~300 MB).
- `restart: unless-stopped` ressuscitou o container, mas root cause é o vazamento.

**How to apply:**
- Padrão do helper (já aplicado em `backend/app/services/scheduler_service.py`):
  ```python
  def _release_job_lock(job_id: str) -> None:
      job_statuses[job_id]["is_running"] = False
      try:
          import gc; gc.collect()
      except Exception: pass
  ```
- Padrão do guard no trigger manual:
  ```python
  if job_id in job_statuses and job_statuses[job_id].get("is_running"):
      logger.warning("Refusing to trigger '%s' — already running", job_id); return False
  ```
- Sempre setar `is_running = True` ANTES de criar a task (não dentro do wrapper) para evitar race.
- Aplicar `_release_job_lock()` em finally de **todos** os `_xxx_job_wrapper()` (scan, recurring, auto_delete), não só em um.

**Validação:** 122 pytest tests passing após os patches. Em prod, container de 74.89 MiB / 700 MiB (10.70%) idle — bem abaixo do cap.
