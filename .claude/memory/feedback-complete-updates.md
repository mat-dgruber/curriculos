---
name: Complete Cross-Cutting Updates
description: When adding new features like scrapers, update ALL related places — frontend filters, pipes, notifications, seed data, docs, tests — not just the core
type: feedback
---

When implementing new features (e.g. new scrapers/platforms), update every place that references them — not just the core implementation.

**Why:** User explicitly asked to update "Vagas e em todos os demais lugares q precisarem" after the orchestrator was done. A follow-up agent found gaps in: notification_service.py (hardcoded 3 platforms in email), platform-class.pipe.ts (only 3 platform colors), jobs-list.component.ts (only 3 filter options), roadmap.md (still marked PENDENTE), seed.py (no examples of new platforms). This happened TWICE — first time for initial scraper work, second time when user asked "o q temos de novo" and an agent found the notification_service gap plus outdated docs.

**How to apply:** After adding a new entity type (platform, status, category), grep the entire codebase for all references and update every occurrence. Key places to check: pipes, filter dropdowns, email templates, seed data, docs/roadmap, test fixtures, and any hardcoded switch/case statements. Use `grep -r "platform_name"` across both backend/ and frontend/ directories.
