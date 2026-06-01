---
name: Roadmap Phase Workflow
description: User works through roadmap phases one at a time but can skip phases based on priority.
type: feedback
---

User works through the roadmap phase by phase. They say "vamos para a fase X" to initiate each phase, and expect all items within that phase to be implemented before moving on. However, they CAN skip phases.

**Why:** User prefers a structured, incremental approach — complete one phase fully before starting the next. But they also prioritize based on immediate value (skipped Fase 4 B2B to do Fase 5 UX).

**How to apply:** When user says "vamos para a fase X", read that phase from docs/roadmap.md, implement all items in it (using parallel subagents when possible), run tests, update roadmap status to [COMPLETO], and ask if they want to proceed to the next phase. Respect phase skipping — user knows their priorities. Don't assume sequential execution is mandatory.