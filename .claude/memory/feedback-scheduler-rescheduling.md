---
name: Scheduler Rescheduling and Validation Rules
description: Learnings about APScheduler interval synchronization from candidate profile database settings and robust PDF magic bytes validation.
type: feedback
---

Synchronize the APScheduler `scan_jobs` trigger with the interval stored in the `candidate_profiles` table, and ensure profile updates reschedule the job dynamically. Also, perform magic bytes check for PDF uploads.

**Why:**
- The background scanner scheduler in `scheduler_service.py` was defaulting to a hardcoded configuration variable (`settings.scan_interval_hours`), completely ignoring the user-configured frequency (`scan_interval_hours`) in the database.
- Updating the profile settings did not reschedule the APScheduler task, leaving the scanner working at the old interval until a full application restart.
- Checking only `content_type` for PDF uploads can be easily bypassed. Robust security requires validating the file signature (magic bytes `%PDF`).

**How to apply:**
- In `scheduler_service.py`, query the database during startup to fetch the candidate's preferred `scan_interval_hours` (falling back to settings if not found) instead of relying solely on `settings.scan_interval_hours`.
- Create a dedicated helper `reschedule_scan_job(hours: int)` in `scheduler_service.py` that modifies the existing job trigger dynamically using `scheduler.reschedule_job('scan_jobs', trigger=IntervalTrigger(hours=hours))`.
- Call this helper inside the profile PUT router (`routes/profile.py`) when the `scan_interval_hours` is successfully updated.
- For PDF file validation, read the first 4 bytes of the uploaded file and verify that they match `b'%PDF'` to ensure it's a genuine PDF.
