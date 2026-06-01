---
name: Subagent Timeouts on Large Tasks
description: Subagents frequently get terminated by API when doing large doc generation or multi-file frontend work — handle manually or split into smaller tasks.
type: feedback
---

Subagents (especially general-purpose type) frequently get terminated with "API Error: terminated" when performing large documentation generation or multi-file frontend component creation tasks.

**Why:** The tasks are too large for a single agent context window — writing 500+ line docs, reading many files, then writing large output exceeds the agent's budget. This happened consistently with: infrastructure docs, future-features docs, scaling docs, dark/light mode toggle, dashboard charts, notifications, mobile responsiveness, and PWA setup.

**How to apply:** 
- For large documentation (>300 lines), write directly instead of delegating to subagents
- For frontend features that touch many files, either write directly or split into smaller focused subagent tasks
- Subagents work well for: small focused fixes, test creation, single-file modifications, research
- Subagents fail reliably for: multi-file frontend components, large documentation generation, complex config changes
- When a subagent terminates, check if it wrote partial output before failing — sometimes files are created but incomplete
- For 5 parallel agents, expect 1-2 to fail — have a fallback plan to implement those manually
