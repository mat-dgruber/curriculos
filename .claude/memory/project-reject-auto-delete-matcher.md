---
name: Job Rejection & Auto-Delete (Implemented)
description: Implemented features — job exclusion with rejected_jobs history, auto-delete non-favorites, matcher refinement. 120 tests passing.
type: project
---

Three interconnected features implemented on 2026-06-01. Spec at `docs/superpowers/specs/2026-06-01-reject-jobs-and-matcher-improvement-design.md`.

1. **Job exclusion** — delete jobs from DB with `rejected_jobs` history table (URL, title, company, reason, notes). Per-job delete button + batch selection (checkbox) + reject modal with reason dropdown.
2. **Auto-deletion** — non-favorited jobs auto-deleted after configurable period (`auto_delete_days`, default 30). Favorites are never deleted. Runs as daily APScheduler task at 3am. Preview endpoint available.
3. **Matcher refinement** — scoring weights: role 40pts, keywords 35pts (7pts×5 max), location 15pts, platform 5pts. -20pt penalty if ZERO keywords match. MIN_SCORE=20 filter (jobs below this aren't saved). Auto "Remoto" match when user prefers remote.

**Key files:**
- Backend: `app/models/rejected_job.py`, `app/services/auto_delete_service.py`, `app/services/matcher.py`, `app/services/scan_service.py`
- API: DELETE `/jobs/{id}`, POST `/jobs/reject-batch`, GET `/jobs/rejected`, POST `/jobs/auto-delete/preview|run`
- Frontend: JobsService (deleteJob, rejectBatch), JobsListComponent (checkboxes, reject modal), JobDetailComponent (delete button)
- Profile: `auto_delete_days` field (configurable, 0=disabled)
- Migrations: `f1a2b3c4d5e6` (rejected_jobs table), `g2b3c4d5e6f7` (auto_delete_days column)

**Why:** User wants to control which jobs they see, ensure scrapers pull relevant results, and keep the DB clean without manual curation.

**How to apply:** Feature fully implemented. 120 tests passing. User rejected status-based exclusion in favor of direct DB deletion + history table. DELETE with body uses `Request` + `await request.json()` since httpx test client doesn't support `json=` on delete.
