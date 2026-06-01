---
name: Preferência por paralelismo com subagentes
description: User prefers dispatching parallel subagents for independent tasks rather than sequential execution.
type: feedback
---

When faced with multiple independent tasks, dispatch subagents in parallel instead of executing sequentially.

**Why:** User explicitly asked "vc consegue disparar subagentes para cada tarefa?" — they want maximum throughput and don't want to wait for sequential completion of independent work.

**Orchestrator Pattern (2026-06-01):** When fixing multiple bugs with different priority tiers, user wants an orchestrator that dispatches parallel subagents grouped by tier (e.g., MUST FIX / SHOULD FIX / NICE TO HAVE). Each agent handles independent files. The orchestrator coordinates and reports results. Verified working with 3 parallel agents (MUST FIX, SHOULD UX, NICE TO HAVE) — all succeeded and verifier confirmed 13/13 checks passed.

**How to apply:** When a task has 3+ independent subtasks (creating multiple files, running multiple analyses, fixing multiple bugs), launch them as parallel background agents. Group related work into batches. This applies to documentation tasks, file creation, testing, bug fixes, and any work where subtasks don't depend on each other's output. Always run a verification agent after parallel work completes to confirm consistency across files.

**⚠️ OOM Risk (2026-05-31):** Another OpenClaude session crashed with `FATAL ERROR: Ineffective mark-compact near heap limit Allocation failed - JavaScript heap out of memory`. Likely caused by too many parallel agents accumulating context simultaneously. Cap at 6 concurrent agents per session (raised from 3-4 after user approved 6-agent batch on 2026-06-01). 5-agent worktree batch ran successfully on 2026-06-01 for icon migration. If a session crashes, run `reset` in the terminal to fix corrupted ANSI output.

**⚠️ Agent Termination (2026-06-01):** Agents with large tasks (especially writing long documentation files) can be terminated by the system with `API Error: terminated` before completing. When an agent fails, verify if its output file was created before relaunching. If the file exists with content, it completed the write but was killed during cleanup. If empty, relaunch with a more focused prompt or write the content directly.

**⚠️ Frontend Multi-File Tasks Fail Rate (2026-06-01):** Subagents touching multiple frontend files (dark/light mode, notifications, mobile responsiveness) were terminated ~60% of the time. Backend single-file tasks (upload CV, DELETE endpoint, scrapers) succeeded ~95%. Pattern: backend tasks modify 1-2 files with clear instructions; frontend tasks need to read 5+ files then write 2-3, which exceeds agent budget. Recommendation: handle multi-file frontend features directly, use subagents for single-file creation only.

**⚠️ Worktree CWD Issue (2026-06-01):** Agents launched with `isolation: "worktree"` may start in a different working directory (e.g., `.claude/` subdirectory) instead of the project root. If an agent fails with "file does not exist" errors, the CWD is likely wrong. Fix: include explicit `cd /path/to/project/frontend` instructions at the top of the worker prompt. One worker failed 3x before being relaunched with correct CWD instructions.

**Worktree Agent Prompt Specificity (2026-06-01):** Agents with detailed SVG paths and animation specs in their prompts succeeded on first try. Agents with vague "create icons based on itshover.com" prompts needed multiple relaunches. Always include the exact data (paths, CSS, file names) in the prompt rather than telling agents to fetch it themselves.

**⚠️ Worker Scope Creep (2026-06-01):** Worker 4 ignored its task (create chevron icon components) and spent its entire budget exploring Swagger UI and trying to authenticate with the backend API. The agent got lost because the prompt mentioned the project broadly. Fix: add explicit scope guards ("NÃO acesse Swagger, NÃO inicie servidor, NÃO faça login") and keep prompts laser-focused on the specific task. Include "What NOT to do" sections in worker prompts.

**⚠️ Large Refactoring: Direct vs Worktree (2026-06-01):** For large refactoring tasks (migrating 26 SVGs across 14 files), worktree agents had ~40% failure rate (3 of 5 workers needed manual fixes or retries). CWD issues, scope creep, and Write tool failures in isolated worktrees caused delays. More reliable approach: use agents for component creation (isolated files), then do consumer modifications directly in the main repo. This hybrid approach completed the task while maintaining codebase consistency.

**shadcn/ui Incompatible with Angular (2026-06-01):** `npx shadcn@latest add` only works for React projects. For Angular, create standalone SVG icon components with CSS transitions instead. itshover.com icons are React/Framer Motion — extract paths, convert to Angular `:host:hover` CSS.
