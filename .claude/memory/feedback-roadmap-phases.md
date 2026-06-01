---
name: Roadmap Phase Workflow
description: User works through roadmap phases sequentially, one at a time, asking to implement each phase.
type: feedback
---

User works through the roadmap phase by phase. They say "vamos para a fase X" to initiate each phase, and expect all items within that phase to be implemented before moving on.

**Why:** User prefers a structured, incremental approach — complete one phase fully before starting the next. They review the roadmap, pick the next phase, and expect the assistant to implement everything in it.

**How to apply:** When user says "vamos para a fase X", read that phase from docs/roadmap.md, implement all items in it (using parallel subagents when possible), run tests, update roadmap status to [COMPLETO], and ask if they want to proceed to the next phase. Don't skip ahead or start the next phase without explicit request.