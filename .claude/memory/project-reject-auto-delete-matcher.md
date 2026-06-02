---
name: Job Rejection & Auto-Delete (Implemented)
description: Implemented features — job exclusion with rejected_jobs history, auto-delete non-favorites, matcher refinement, smart delete filters, selection visual indicators. 120 tests passing.
type: project
---

Three interconnected features implemented on 2026-06-01. Spec at `docs/superpowers/specs/2026-06-01-reject-jobs-and-matcher-improvement-design.md`.

1. **Job exclusion** — delete jobs from DB with `rejected_jobs` history table (URL, title, company, reason, notes). Per-job delete button + batch selection (checkbox) + reject modal with reason dropdown.
2. **Auto-deletion** — non-favorited jobs auto-deleted after configurable period (`auto_delete_days`, default 30). Favorites are never deleted. Runs as daily APScheduler task at 3am. Preview endpoint available.
3. **Matcher refinement** — scoring weights: role 40pts, keywords 35pts (7pts×5 max), location 15pts, platform 5pts. -20pt penalty if ZERO keywords match. MIN_SCORE=20 filter (jobs below this aren't saved). Auto "Remoto" match when user prefers remote.

**Smart delete filters (2026-06-01):**
- Score threshold: select all jobs below a configurable score (10/20/30/40/50)
- Age filter: select jobs older than N days (7/14/30/60/90)
- Non-favorites: select all non-favorited jobs
- Filters REPLACE the current selection (not add), so switching between filters clears the previous selection

**Bulk delete by filter (2026-06-01):**
- "Excluir todas" button sends POST `/jobs/reject-by-filter` with maxScore, olderThanDays, or nonFavoritesOnly
- Deletes ALL matching jobs across ALL pages in one request — not limited to current page
- Endpoint creates rejected_jobs records before deleting, preserving history

**Selection visual indicators (2026-06-01):**
- Selected cards: red border (`border-red-500/50`), subtle red bg (`bg-red-500/8`), shadow
- Checkbox: red with red background when selected (`bg-red-500/15`)
- Badge "Excluir" with trash icon appears next to score badge on selected cards
- Batch bar turns red-tinted with count

**Reject modal theme fix (2026-06-01):**
- Modal uses `bg-dark-surface`/`bg-dark-bg`/`border-dark-border` classes — NOT `glass-v2`
- `backdrop-blur-md` + `shadow-2xl` for premium feel
- Input/textarea use `bg-dark-bg` + `focus:border-primary` for theme consistency
- Both jobs-list and job-detail modals updated
- Delete filter panel uses `<app-select>` (themed custom dropdown) instead of native `<select>`

**Key files:**
- Backend: `app/models/rejected_job.py`, `app/services/auto_delete_service.py`, `app/services/matcher.py`, `app/services/scan_service.py`
- API: DELETE `/jobs/{id}`, POST `/jobs/reject-batch`, POST `/jobs/reject-by-filter`, GET `/jobs/rejected`, POST `/jobs/auto-delete/preview|run`
- Frontend: JobsService (deleteJob, rejectBatch, rejectByFilter), JobsListComponent (checkboxes, reject modal, smart filters), JobDetailComponent (delete button)
- Profile: `auto_delete_days` field (configurable, 0=disabled)
- Migrations: `f1a2b3c4d5e6` (rejected_jobs table), `g2b3c4d5e6f7` (auto_delete_days column)

**Why:** User wants to control which jobs they see, ensure scrapers pull relevant results, and keep the DB clean without manual curation.

**How to apply:** Feature fully implemented. 120 tests passing. User rejected status-based exclusion in favor of direct DB deletion + history table. DELETE with body uses `Request` + `await request.json()` since httpx test client doesn't support `json=` on delete. Modals must always use theme-aware CSS classes (bg-dark-surface, bg-dark-bg) not glass-v2 or hardcoded colors. `app-select` expects string values — when binding to number signals, convert with `+$event` on change.
