import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.models.rejected_job import RejectedJob

logger = logging.getLogger(__name__)


async def run_auto_delete(db: AsyncSession, auto_delete_days: int) -> dict:
    """Delete non-favorited jobs older than auto_delete_days. Returns summary."""
    if auto_delete_days <= 0:
        return {"deleted": 0, "message": "Auto-delete desativado"}

    cutoff = datetime.utcnow() - timedelta(days=auto_delete_days)
    result = await db.execute(
        select(Job).where(Job.is_favorite == False, Job.found_at < cutoff)
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

    await db.commit()
    logger.info(f"Auto-delete: {len(old_jobs)} vagas removidas (maiores que {auto_delete_days} dias)")
    return {"deleted": len(old_jobs), "message": f"{len(old_jobs)} vagas removidas"}


async def preview_auto_delete(db: AsyncSession, auto_delete_days: int) -> dict:
    """Preview how many jobs would be deleted without actually deleting."""
    if auto_delete_days <= 0:
        return {"would_delete": 0}

    cutoff = datetime.utcnow() - timedelta(days=auto_delete_days)
    result = await db.execute(
        select(Job).where(Job.is_favorite == False, Job.found_at < cutoff)
    )
    jobs = result.scalars().all()
    return {"would_delete": len(jobs)}
