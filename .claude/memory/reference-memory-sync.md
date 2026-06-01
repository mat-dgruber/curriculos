---
name: Memory Sync Git Hooks
description: Sincronização automática da memória do OpenClaude usando Git Hooks (pre-commit e post-merge).
type: reference
---

A memória do OpenClaude neste projeto é sincronizada de forma automática usando Git Hooks.

- **Script de sincronização:** `.claude/sync-claude-memory.sh`
- **Hook Pre-commit:** Copia a memória global do OpenClaude para `.claude/memory` para que ela seja versionada no Git a cada commit.
- **Hook Post-merge:** Atualiza a memória local do OpenClaude com a memória recebida via git pull.
