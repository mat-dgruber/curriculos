---
name: Favorites Are Sacred
description: Favorited jobs must never be auto-deleted — user explicitly wants favorites to persist forever
type: feedback
---

Favorited jobs are permanent and must never be automatically deleted.

**Why:** User stated favorited jobs should stay "eternamente" (eternally). Auto-deletion only applies to non-favorited jobs regardless of their status.

**How to apply:** Any auto-delete or cleanup logic must always check `is_favorite=true` and skip those jobs. When implementing bulk operations, treat favorites as a protected state.
