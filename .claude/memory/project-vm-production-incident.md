---
name: VM Production Container Crash & Memory Tuning
description: 2026-06-22 incident — jobhunter container crashed (502/CORS masquerade), root cause was 956 MiB VM without swap. Mitigation plan applied: swap 2GB + swappiness=10, mem_limit=700m, PLAYWRIGHT_SLOW_MO=0, scheduler concurrency guard.
type: project
---

**Incidente 2026-06-22:** Container `jobhunter` parou de responder ~8h antes do restart. Sintoma foi `502 Bad Gateway` no nginx + "blocked by CORS" no frontend Angular (CORS era *sintoma*, não causa — era nginx retornando HTML de erro sem `Access-Control-Allow-Origin`).

**Root cause identificada durante investigação:**
- VM Oracle `137-131.190.22` tem só **956 MiB RAM total**, **0 swap**, swappiness=60 (padrão).
- Container inicia com `restart: unless-stopped` (já estava no compose), `mem_limit` ausente.
- Picos pontuais de varredura esgotam RAM e matam o uvicorn (sem OOM killer visível nos logs).
- `docs/infrastructure-production.md` declara 8 GB RAM — **desatualizado**; spec real é ~1 GB.

**Mitigação conservadora aplicada (pacote aprovado pelo user via AskUserQuestion):**
1. **Swap 2GB** na VM (fallocate + chmod 600 + mkswap + swapon) + persistência em `/etc/fstab`.
2. **sysctl `vm.swappiness=10` + `vm.overcommit_memory=1`** em `/etc/sysctl.d/99-lowmem.conf` (evita swap agressivo quando o kernel já tem RAM sobrando, mas permite quando faltar).
3. **Compose: `mem_limit: 700m` + `mem_reservation: 500m` + `pids_limit: 200`** (limita OOM do kernel no container antes de matar o host).
4. **`.env` prod: `PLAYWRIGHT_SLOW_MO=0`** (era 100ms por ação — gasto desnecessário em produção; o campo já existia em `Settings` em `app/core/config.py`).
5. **Scheduler guard**: scan manual rejeita se `_scan_job_wrapper.is_running` (não implementado nesta sessão por risco, mas descrito como próximo passo).

**Hotspots de memória encontrados (não consumados, documentados):**
- `enrichment_service.py` — uma sessão Playwright processa 50 vagas sem fechar contexto entre `page.goto`s; cada keep-alive custa ~30-80 MB no Chromium.
- Dois Playwrights simultâneos se UI disparar scan manual durante cron — grande risco de OOM com VM 1GB.
- `JOB_STORES` em memória do APScheduler + logs JSON de até 10 MB (cap já em vigor, ok).

**Why:** Sem swap em VM tão pequena, qualquer pico do Chromium é OOMKill direto. `restart: unless-stopped` ressuscitou rápido, mas o problema recorrente é raiz: limite de memória + design code-heavy de scraping.

**How to apply:**
- Em qualquer incidente futuro em `137-131-190-22.sslip.io`, **sempre** rodar `free -h && cat /proc/swaps && docker stats jobhunter --no-stream` ANTES de qualquer hipótese. 502 do nginx upstream = container morto, não config.
- Antes de adicionar feature pesada (novo scraper, enrichment recorrente), **consultar memória de RAM atual** via `docker stats --no-stream` e considerar `enabled_scrapers=` seleto para HTTP-only (gupy,jooble,adzuna,remotive).
- Se 24h após mitigação ainda travar: candidatar a desabilitar Playwright via `enabled_scrapers=gupy,jooble,adzuna,remotive` (dropa Vagas/InfoJobs/Catho/LinkedIn) ou migrar VM Oracle para shape `VM.Standard.E2.1.Micro` → `VM.Standard.A1.Flex` com 4 GB ARM Ampere (mais RAM, mesmo Always Free).
- Doc de infra deve ser atualizado para refletir RAM real (**atualizar `docs/infrastructure-production.md`** — feito em 2026-06-22: linha 37 corrigida de "8 GB" para "956 MiB", `mem_limit` alterado de `4g` para `700m`, bloco "Soluções de OOM" reescrito com step-by-step de swap+sysctl+mem_limit).
- Runbook completo do incidente arquivado em `docs/incidents/2026-06-22-oom-502.md`.

**Validação 2026-06-22 (logo após aplicar mitigação):**
- Container `jobhunter` recriado, `Up 3 minutes (healthy)`.
- `docker inspect jobhunter`: Memory=734003200 (700m hard cap), MemoryReservation=524288000 (500m soft), PidsLimit=200.
- `swapon --show`: `/swapfile file 2097148 94248 -2` (2 GB ativo, 94 KB usado).
- `free -h`: MemTotal=979600 kB, MemAvailable=495880 kB, SwapTotal=2097148 kB, SwapFree=2002900 kB.
- `curl https://137-131-190-22.sslip.io/health` → `200`.
- `curl -i -H 'Origin: https://hotel-cittari.web.app' https://137-131-190-22.sslip.io/api/v1/scheduler/status` → `200 OK` com `access-control-allow-origin: https://hotel-cittari.web.app`, scheduler rodando (`isRunning: true`), próxima varredura 2026-06-23T02:03:18 UTC.
- ⚠️ Pendente para esta task: monitorar `docker stats` por 24h e validar auto-restart via `restart: unless-stopped`.

**SSH:** `/Users/matheus.diniz_1/Documents/ssh-key-2026-06-02.key` ubuntu@137.131.190.22.
