import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Track job statuses
job_statuses = {
    "scan_jobs": {"last_run": None, "last_status": None, "is_running": False},
    "recurring_send": {"last_run": None, "last_status": None, "is_running": False},
}

is_paused = False
paused_until: datetime | None = None


async def _scan_job_wrapper():
    """Wrapper for scan job that tracks status."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping scan.")
        return

    job_statuses["scan_jobs"]["is_running"] = True
    job_statuses["scan_jobs"]["last_run"] = datetime.utcnow()

    try:
        from app.services.scan_service import run_scan
        result = await run_scan()
        job_statuses["scan_jobs"]["last_status"] = "success"
        logger.info(f"Scan completed: {result}")
    except Exception as e:
        job_statuses["scan_jobs"]["last_status"] = "error"
        logger.error(f"Scan failed: {e}")
    finally:
        job_statuses["scan_jobs"]["is_running"] = False


async def _recurring_send_wrapper():
    """Wrapper for recurring send job that tracks status."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping recurring send.")
        return

    job_statuses["recurring_send"]["is_running"] = True
    job_statuses["recurring_send"]["last_run"] = datetime.utcnow()

    try:
        from app.services.recurring_service import run_recurring_sends
        result = await run_recurring_sends()
        job_statuses["recurring_send"]["last_status"] = "success"
        logger.info(f"Recurring send completed: {result}")
    except Exception as e:
        job_statuses["recurring_send"]["last_status"] = "error"
        logger.error(f"Recurring send failed: {e}")
    finally:
        job_statuses["recurring_send"]["is_running"] = False


def start_scheduler():
    """Initialize and start the APScheduler."""
    global is_paused, paused_until

    # Check if we should unpause
    if paused_until and datetime.utcnow() >= paused_until:
        is_paused = False
        paused_until = None

    # Scan job - every N hours
    scheduler.add_job(
        _scan_job_wrapper,
        trigger=IntervalTrigger(hours=settings.scan_interval_hours),
        id="scan_jobs",
        name="Varredura de vagas",
        replace_existing=True,
    )

    # Recurring send - day 1 of each month at 10:00
    scheduler.add_job(
        _recurring_send_wrapper,
        trigger=CronTrigger(day=settings.recurring_send_day, hour=10, minute=0),
        id="recurring_send",
        name="Envio recorrente empresas fixas",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"Scheduler started. Scan every {settings.scan_interval_hours}h, recurring send day {settings.recurring_send_day}")


def stop_scheduler():
    """Stop the scheduler."""
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")


def pause_scheduler(until: datetime | None = None):
    """Pause the scheduler globally."""
    global is_paused, paused_until
    is_paused = True
    paused_until = until
    logger.info(f"Scheduler paused until {until or 'indefinitely'}")


def resume_scheduler():
    """Resume the scheduler."""
    global is_paused, paused_until
    is_paused = False
    paused_until = None
    logger.info("Scheduler resumed")


def get_scheduler_status() -> dict:
    """Get current scheduler status."""
    global is_paused, paused_until

    # Check if pause has expired
    if paused_until and datetime.utcnow() >= paused_until:
        is_paused = False
        paused_until = None

    jobs = []
    for job in scheduler.get_jobs():
        job_info = job_statuses.get(job.id, {})
        next_run = job.next_run_time
        jobs.append({
            "id": job.id,
            "name": job.name,
            "nextRun": next_run.isoformat() if next_run else None,
            "lastRun": job_info.get("last_run").isoformat() if job_info.get("last_run") else None,
            "lastStatus": job_info.get("last_status"),
            "trigger": str(job.trigger),
        })

    return {
        "isRunning": not is_paused,
        "jobs": jobs,
        "pausedUntil": paused_until.isoformat() if paused_until else None,
    }


async def trigger_job(job_id: str) -> bool:
    """Manually trigger a specific job."""
    job = scheduler.get_job(job_id)
    if not job:
        return False

    if job_id == "scan_jobs":
        import asyncio
        asyncio.create_task(_scan_job_wrapper())
    elif job_id == "recurring_send":
        import asyncio
        asyncio.create_task(_recurring_send_wrapper())
    else:
        return False

    return True
