import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.models.rejected_job import RejectedJob

logger = logging.getLogger(__name__)


async def run_auto_delete(db: AsyncSession, auto_delete_days: int) -> dict:
    """Delete non-favorited jobs and archived applications older than auto_delete_days. Returns summary."""
    if auto_delete_days <= 0:
        return {"deleted": 0, "message": "Auto-delete desativado"}

    cutoff = datetime.utcnow() - timedelta(days=auto_delete_days)
    result = await db.execute(
        select(Job).where(~Job.is_favorite, Job.found_at < cutoff)
    )
    old_jobs = result.scalars().all()

    for job in old_jobs:
        rejected = RejectedJob(
            original_job_id=job.id,
            url=job.url,
            title=job.title,
            company=job.company,
            location=job.location,
            platform=job.platform,
            score=job.score,
            reason="auto_delete",
        )
        db.add(rejected)
        await db.delete(job)

    # Clean up archived applications older than auto_delete_days
    from app.models.application import Application
    app_result = await db.execute(
        select(Application).where(Application.status == "Arquivado", Application.updated_at < cutoff)
    )
    old_apps = app_result.scalars().all()
    for app in old_apps:
        await db.delete(app)

    await db.commit()
    logger.info(f"Auto-delete: {len(old_jobs)} vagas e {len(old_apps)} candidaturas arquivadas removidas (maiores que {auto_delete_days} dias)")
    return {
        "deleted_jobs": len(old_jobs),
        "deleted_applications": len(old_apps),
        "deleted": len(old_jobs) + len(old_apps),
        "message": f"{len(old_jobs)} vagas e {len(old_apps)} candidaturas removidas"
    }


async def preview_auto_delete(db: AsyncSession, auto_delete_days: int) -> dict:
    """Preview how many jobs and applications would be deleted without actually deleting."""
    if auto_delete_days <= 0:
        return {"would_delete": 0, "would_delete_jobs": 0, "would_delete_applications": 0}

    cutoff = datetime.utcnow() - timedelta(days=auto_delete_days)
    result = await db.execute(
        select(Job).where(~Job.is_favorite, Job.found_at < cutoff)
    )
    jobs = result.scalars().all()

    from app.models.application import Application
    app_result = await db.execute(
        select(Application).where(Application.status == "Arquivado", Application.updated_at < cutoff)
    )
    apps = app_result.scalars().all()

    return {
        "would_delete": len(jobs) + len(apps),
        "would_delete_jobs": len(jobs),
        "would_delete_applications": len(apps)
    }
