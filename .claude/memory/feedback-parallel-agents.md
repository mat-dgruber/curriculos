---
name: Preferência por paralelismo com subagentes
description: User prefers dispatching parallel subagents for independent tasks rather than sequential execution.
type: feedback
---

When faced with multiple independent tasks, dispatch subagents in parallel instead of executing sequentially.

**Why:** User explicitly asked "vc consegue disparar subagentes para cada tarefa?" — they want maximum throughput and don't want to wait for sequential completion of independent work.

**How to apply:** When a task has 3+ independent subtasks (creating multiple files, running multiple analyses, etc.), launch them as parallel background agents. Group related work into batches. This applies to documentation tasks, file creation, testing, and any work where subtasks don't depend on each other's output.
