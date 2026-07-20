import logging
from datetime import datetime

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
    "auto_delete": {"last_run": None, "last_status": None, "is_running": False},
    "weekly_report": {"last_run": None, "last_status": None, "is_running": False},
    "imap_check": {"last_run": None, "last_status": None, "is_running": False},
}

is_paused = False
paused_until: datetime | None = None


def _release_job_lock(job_id: str) -> None:
    """Reset running flag and free retained heap.

    Jobs keep references to async DB sessions, Playwright pages, and
    payload objects in their locals. Without an explicit gc.collect()
    after the lock is released, CPython holds onto them in gen-2 until
    the next full collection — on 1 GiB VMs that pushes us towards OOM.
    """
    job_statuses[job_id]["is_running"] = False
    try:
        import gc
        gc.collect()
    except Exception:  # gc.collect is best-effort hygiene, never raise
        pass


async def _scan_job_wrapper():
    """Wrapper for scan job that tracks status."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping scan.")
        return

    # ponytail: Trava anti-overlapping para evitar estouro de memória ou travamento de banco SQLite na VM
    if job_statuses["scan_jobs"]["is_running"]:
        logger.warning("Scan job is already running. Skipping execution to prevent overlapping.")
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
        _release_job_lock("scan_jobs")


async def _recurring_send_wrapper():
    """Wrapper for recurring send job that tracks status."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping recurring send.")
        return

    # ponytail: Trava anti-overlapping
    if job_statuses["recurring_send"]["is_running"]:
        logger.warning("Recurring send job is already running. Skipping execution.")
        return

    job_statuses["recurring_send"]["is_running"] = True
    job_statuses["recurring_send"]["last_run"] = datetime.utcnow()

    try:
        from app.services.recurring_service import run_recurring_sends
        result = await run_recurring_sends()
        job_statuses["recurring_send"]["last_status"] = "success"
        logger.info(f"Send completed: {result}")
    except Exception as e:
        job_statuses["recurring_send"]["last_status"] = "error"
        logger.error(f"Recurring send failed: {e}")
    finally:
        _release_job_lock("recurring_send")


async def _auto_delete_wrapper():
    """Wrapper for auto-delete job that tracks status."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping auto-delete.")
        return

    # ponytail: Trava anti-overlapping
    if job_statuses["auto_delete"]["is_running"]:
        logger.warning("Auto-delete job is already running. Skipping execution.")
        return

    job_statuses["auto_delete"]["is_running"] = True
    job_statuses["auto_delete"]["last_run"] = datetime.utcnow()

    try:
        from app.services.auto_delete_service import run_auto_delete
        from app.core.database import async_session
        from sqlalchemy import select
        from app.models.profile import CandidateProfile

        async with async_session() as db:
            result = await db.execute(select(CandidateProfile).limit(1))
            profile = result.scalar_one_or_none()
            days = profile.auto_delete_days if profile else 30

            result = await run_auto_delete(db, days)
            job_statuses["auto_delete"]["last_status"] = "success"
            logger.info(f"Auto-delete completed: {result}")
    except Exception as e:
        job_statuses["auto_delete"]["last_status"] = "error"
        logger.error(f"Auto-delete failed: {e}")
    finally:
        _release_job_lock("auto_delete")


async def _weekly_report_wrapper():
    """Wrapper for weekly digest report SMTP email."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping weekly report.")
        return

    # ponytail: Trava anti-overlapping
    if job_statuses["weekly_report"]["is_running"]:
        logger.warning("Weekly report job is already running. Skipping execution.")
        return

    job_statuses["weekly_report"]["is_running"] = True
    job_statuses["weekly_report"]["last_run"] = datetime.utcnow()

    try:
        from app.core.database import async_session
        from sqlalchemy import select, func
        from app.models.job import Job
        from app.models.application import Application
        from datetime import timedelta

        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        async with async_session() as db:
            # 1. Total jobs found in last 7 days
            stmt_jobs = select(func.count()).select_from(Job).where(Job.found_at >= seven_days_ago)
            total_jobs = (await db.execute(stmt_jobs)).scalar() or 0

            # 2. Total applications in last 7 days
            stmt_apps = select(func.count()).select_from(Application).where(Application.created_at >= seven_days_ago)
            total_apps = (await db.execute(stmt_apps)).scalar() or 0

            # 3. Highest scoring job in last 7 days
            stmt_best = select(Job).where(Job.found_at >= seven_days_ago).order_by(Job.score.desc()).limit(1)
            best_job = (await db.execute(stmt_best)).scalar_one_or_none()

        # Send email
        if total_jobs > 0 or total_apps > 0:
            best_job_str = f"<li>🏆 <strong>Melhor Oportunidade:</strong> {best_job.title} na <strong>{best_job.company}</strong> (Score: {best_job.score}%)</li>" if best_job else ""
            body = f"""
            <h2>📊 Relatório Semanal de Atividades — JobHunter</h2>
            <p>Olá! Aqui está o resumo das suas oportunidades encontradas na última semana:</p>
            <ul>
                <li>🔍 <strong>Novas Vagas Analisadas pela Rede Neural:</strong> {total_jobs}</li>
                <li>✉️ <strong>Candidaturas Automáticas Realizadas:</strong> {total_apps}</li>
                {best_job_str}
            </ul>
            <p>Acesse o painel do seu <strong>JobHunter</strong> para verificar as novas recomendações técnicas!</p>
            """
            from app.services.notification_service import send_email
            await send_email("Relatório Semanal de Oportunidades", body)
            job_statuses["weekly_report"]["last_status"] = "success"
            logger.info("Weekly digest report sent successfully.")
        else:
            logger.info("No activities or jobs found in the past week. Skipping email.")
            job_statuses["weekly_report"]["last_status"] = "success"
    except Exception as e:
        job_statuses["weekly_report"]["last_status"] = "error"
        logger.error(f"Weekly report failed: {e}")
    finally:
        _release_job_lock("weekly_report")


async def _imap_check_wrapper():
    """Wrapper for IMAP response check job that tracks status."""
    if is_paused and paused_until and datetime.utcnow() < paused_until:
        logger.info("Scheduler is paused. Skipping IMAP check.")
        return

    if job_statuses["imap_check"]["is_running"]:
        logger.warning("IMAP check job is already running. Skipping execution.")
        return

    job_statuses["imap_check"]["is_running"] = True
    job_statuses["imap_check"]["last_run"] = datetime.utcnow()

    try:
        from app.services.imap_service import check_company_responses
        result = await check_company_responses()
        job_statuses["imap_check"]["last_status"] = "success"
        logger.info(f"IMAP check completed: {result}")
    except Exception as e:
        job_statuses["imap_check"]["last_status"] = "error"
        logger.error(f"IMAP check failed: {e}")
    finally:
        _release_job_lock("imap_check")


async def start_scheduler():
    """Initialize and start the APScheduler."""
    global is_paused, paused_until

    # Check if we should unpause or load state from DB
    try:
        from sqlalchemy import select
        from app.models.profile import CandidateProfile
        from app.core.database import async_session
        async with async_session() as db:
            result = await db.execute(select(CandidateProfile).limit(1))
            profile = result.scalar_one_or_none()
            if profile:
                is_paused = profile.is_paused
                paused_until = profile.paused_until
                logger.info(f"Loaded scheduler state from DB profile: is_paused={is_paused}, paused_until={paused_until}")
    except Exception as e:
        logger.error(f"Failed to load scheduler state from DB: {e}")

    # Check if we should unpause
    if paused_until and datetime.utcnow() >= paused_until:
        is_paused = False
        paused_until = None
        try:
            from sqlalchemy import select
            from app.models.profile import CandidateProfile
            from app.core.database import async_session
            async with async_session() as db:
                result = await db.execute(select(CandidateProfile).limit(1))
                profile = result.scalar_one_or_none()
                if profile:
                    profile.is_paused = False
                    profile.paused_until = None
                    await db.commit()
        except Exception as e:
            logger.error(f"Failed to auto-resume scheduler in DB: {e}")

    # Load interval from database if profile exists
    hours = settings.scan_interval_hours
    try:
        from sqlalchemy import select
        from app.models.profile import CandidateProfile
        from app.core.database import async_session
        async with async_session() as db:
            result = await db.execute(select(CandidateProfile).limit(1))
            profile = result.scalar_one_or_none()
            if profile and profile.scan_interval_hours:
                hours = profile.scan_interval_hours
                logger.info(f"Loaded scan interval from DB profile: {hours} hours")
    except Exception as e:
        logger.error(f"Failed to load scan interval from DB, using fallback: {e}")

    # Scan job - every N hours
    scheduler.add_job(
        _scan_job_wrapper,
        trigger=IntervalTrigger(hours=hours),
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

    # Auto-delete - daily at 3am
    scheduler.add_job(
        _auto_delete_wrapper,
        trigger=CronTrigger(hour=3, minute=0),
        id="auto_delete",
        name="Exclusão automática de vagas antigas",
        replace_existing=True,
    )

    # Weekly report - Sunday at 8pm (20:00)
    scheduler.add_job(
        _weekly_report_wrapper,
        trigger=CronTrigger(day_of_week="sun", hour=20, minute=0),
        id="weekly_report",
        name="Relatório Semanal de Atividades SMTP",
        replace_existing=True,
    )

    # IMAP check - every 6 hours
    scheduler.add_job(
        _imap_check_wrapper,
        trigger=IntervalTrigger(hours=6),
        id="imap_check",
        name="Monitoramento de respostas por e-mail",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"Scheduler started. Scan every {hours}h, recurring send day {settings.recurring_send_day}")


def reschedule_scan_job(hours: int):
    """Dynamically reschedule the scan job to use a new interval."""
    try:
        job = scheduler.get_job("scan_jobs")
        if job:
            job.reschedule(trigger=IntervalTrigger(hours=hours))
            logger.info(f"Scan job successfully rescheduled to run every {hours} hours")
            return True
        else:
            logger.warning("Scan job not found. Cannot reschedule.")
    except Exception as e:
        logger.error(f"Failed to reschedule scan job: {e}")
    return False


def stop_scheduler():
    """Stop the scheduler."""
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")


async def pause_scheduler(until: datetime | None = None):
    """Pause the scheduler globally."""
    global is_paused, paused_until
    is_paused = True
    paused_until = until
    logger.info(f"Scheduler paused until {until or 'indefinitely'}")

    try:
        from sqlalchemy import select
        from app.models.profile import CandidateProfile
        from app.core.database import async_session
        async with async_session() as db:
            result = await db.execute(select(CandidateProfile).limit(1))
            profile = result.scalar_one_or_none()
            if profile:
                profile.is_paused = True
                profile.paused_until = until
                await db.commit()
                logger.info("Persisted scheduler pause state to DB")
    except Exception as e:
        logger.error(f"Failed to persist scheduler pause state to DB: {e}")


async def resume_scheduler():
    """Resume the scheduler."""
    global is_paused, paused_until
    is_paused = False
    paused_until = None
    logger.info("Scheduler resumed")

    try:
        from sqlalchemy import select
        from app.models.profile import CandidateProfile
        from app.core.database import async_session
        async with async_session() as db:
            result = await db.execute(select(CandidateProfile).limit(1))
            profile = result.scalar_one_or_none()
            if profile:
                profile.is_paused = False
                profile.paused_until = None
                await db.commit()
                logger.info("Persisted scheduler resume state to DB")
    except Exception as e:
        logger.error(f"Failed to persist scheduler resume state to DB: {e}")


async def get_scheduler_status() -> dict:
    """Get current scheduler status."""
    global is_paused, paused_until

    # Check if pause has expired
    if paused_until and datetime.utcnow() >= paused_until:
        is_paused = False
        paused_until = None
        try:
            from sqlalchemy import select
            from app.models.profile import CandidateProfile
            from app.core.database import async_session
            async with async_session() as db:
                result = await db.execute(select(CandidateProfile).limit(1))
                profile = result.scalar_one_or_none()
                if profile:
                    profile.is_paused = False
                    profile.paused_until = None
                    await db.commit()
        except Exception as e:
            logger.error(f"Failed to auto-resume scheduler in DB: {e}")

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
    """Manually trigger a specific job.

    Rejects if the same job is already running to prevent concurrent
    Playwright/Chromium instances on memory-constrained VMs (Oracle 1 GiB).
    """
    job = scheduler.get_job(job_id)
    if not job:
        return False

    # Guard: refuse concurrent execution for the same job.
    # We set the flag here BEFORE scheduling the task because the task
    # only flips it to True after first iteration; without this, two
    # manual clicks in quick succession would both fire Playwright.
    if job_id in job_statuses and job_statuses[job_id].get("is_running"):
        logger.warning(
            "Refusing to trigger '%s' manually — already running", job_id
        )
        return False

    if job_id in ("scan_jobs", "recurring_send", "auto_delete"):
        job_statuses[job_id]["is_running"] = True

    import asyncio
    if job_id == "scan_jobs":
        asyncio.create_task(_scan_job_wrapper())
    elif job_id == "recurring_send":
        asyncio.create_task(_recurring_send_wrapper())
    elif job_id == "auto_delete":
        asyncio.create_task(_auto_delete_wrapper())
    else:
        # unknown job_id — undo flag we just set
        if job_id in job_statuses:
            job_statuses[job_id]["is_running"] = False
        return False

    return True
