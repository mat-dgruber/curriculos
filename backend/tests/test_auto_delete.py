"""Tests for auto-delete service."""
import pytest
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def test_auto_delete_removes_old_non_favorite_jobs(client, db):
    from app.models.job import Job
    from app.models.rejected_job import RejectedJob
    from app.services.auto_delete_service import run_auto_delete
    from sqlalchemy import select

    old_job = Job(
        id="old-nonfav",
        title="Old Job",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/old",
        score=50,
        is_favorite=False,
        found_at=datetime.utcnow() - timedelta(days=40),
    )
    fav_job = Job(
        id="old-fav",
        title="Fav Job",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/fav",
        score=50,
        is_favorite=True,
        found_at=datetime.utcnow() - timedelta(days=40),
    )
    recent_job = Job(
        id="recent-nonfav",
        title="Recent Job",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/recent",
        score=50,
        is_favorite=False,
        found_at=datetime.utcnow() - timedelta(days=5),
    )
    db.add_all([old_job, fav_job, recent_job])
    await db.commit()

    result = await run_auto_delete(db, auto_delete_days=30)
    assert result["deleted"] == 1

    r1 = await db.execute(select(Job).where(Job.id == "old-nonfav"))
    assert r1.scalar_one_or_none() is None

    r2 = await db.execute(select(Job).where(Job.id == "old-fav"))
    assert r2.scalar_one_or_none() is not None
    r3 = await db.execute(select(Job).where(Job.id == "recent-nonfav"))
    assert r3.scalar_one_or_none() is not None

    r4 = await db.execute(select(RejectedJob).where(RejectedJob.url == "https://gupy.io/old"))
    rejected = r4.scalar_one_or_none()
    assert rejected is not None
    assert rejected.reason == "auto_delete"


@pytest.mark.asyncio
async def test_auto_delete_disabled_when_days_zero(client, db):
    from app.models.job import Job
    from app.services.auto_delete_service import run_auto_delete
    from sqlalchemy import select

    old_job = Job(
        id="old-nodelete",
        title="Old",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/nodelete",
        score=50,
        is_favorite=False,
        found_at=datetime.utcnow() - timedelta(days=100),
    )
    db.add(old_job)
    await db.commit()

    result = await run_auto_delete(db, auto_delete_days=0)
    assert result["deleted"] == 0

    r = await db.execute(select(Job).where(Job.id == "old-nodelete"))
    assert r.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_auto_delete_preview(client, db):
    from app.models.job import Job
    from app.services.auto_delete_service import preview_auto_delete

    for i in range(5):
        job = Job(
            id=f"preview-{i}",
            title=f"Job {i}",
            company="Corp",
            location="SP",
            platform="gupy",
            url=f"https://gupy.io/preview{i}",
            score=50,
            is_favorite=False,
            found_at=datetime.utcnow() - timedelta(days=40),
        )
        db.add(job)
    await db.commit()

    result = await preview_auto_delete(db, auto_delete_days=30)
    assert result["would_delete"] == 5
