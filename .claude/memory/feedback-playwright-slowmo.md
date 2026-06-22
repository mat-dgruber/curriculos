---
name: Playwright slow_mo em produção é armadilha de memória
description: slow_mo>0 do Playwright em prod causa pico de RAM por pausa entre ações do browser e é a fonte #1 de OOM em VMs pequenas (956 MiB).
type: feedback
---

**Regra:** Em produção, sempre `PLAYWRIGHT_SLOW_MO=0` (`Settings.playwright_slow_mo` em `app/core/config.py`). Default 100ms fica só para debug local.

**Why:** O parâmetro `slow_mo` injeta um `await asyncio.sleep(slow_mo)` entre todas as ações do browser (`page.click`, `page.fill`, `page.goto`, etc.). Em enriquecimento de 50 vagas, isso multiplica o tempo de keep-alive do Chromium, deixando o processo preso em RAM por minutos. Em VM de 956 MiB (Oracle Always Free), qualquer sessão Playwright >2MB de browser residual já empurra o sistema pro OOM.

**How to apply:**
- Ao configurar `.env` de prod: `PLAYWRIGHT_SLOW_MO=0`.
- Em dev local com debug visual: pode usar `PLAYWRIGHT_SLOW_MO=300` ou maior.
- Se o scraper usa Playwright e a VM tem pouca RAM (≤2 GB): preferir desabilitar Playwright totalmente via `enabled_scrapers=gupy,jooble,adzuna,remotive` (HTTP-only).
- Quando introduzir nova config Playwright, revisar todos os scrapers Playwright-based para garantir que herdam `Settings.playwright_slow_mo`, não valor hardcoded.
