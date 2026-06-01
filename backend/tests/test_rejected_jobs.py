"""Tests for job rejection and deletion endpoints."""
import pytest


@pytest.mark.asyncio
async def test_delete_job_creates_rejected_record(client, db):
    from app.models.job import Job
    from datetime import datetime

    job = Job(
        id="del-job-1",
        title="Bad Job",
        company="Bad Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/del1",
        score=30,
        found_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()

    import json as json_mod
    resp = await client.request(
        "DELETE",
        "/api/v1/jobs/del-job-1",
        content=json_mod.dumps({"reason": "incompativel", "notes": "Nao e remoto"}),
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "Vaga excluída"

    # Verify job is deleted
    resp_get = await client.get("/api/v1/jobs/del-job-1")
    assert resp_get.status_code == 404

    # Verify rejected record exists
    from sqlalchemy import select
    from app.models.rejected_job import RejectedJob

    result = await db.execute(select(RejectedJob).where(RejectedJob.url == "https://gupy.io/del1"))
    rejected = result.scalar_one_or_none()
    assert rejected is not None
    assert rejected.reason == "incompativel"
    assert rejected.notes == "Nao e remoto"
    assert rejected.title == "Bad Job"


@pytest.mark.asyncio
async def test_delete_job_not_found(client):
    resp = await client.delete("/api/v1/jobs/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_reject_batch(client, db):
    from app.models.job import Job
    from datetime import datetime

    for i in range(3):
        job = Job(
            id=f"batch-job-{i}",
            title=f"Batch Job {i}",
            company="Corp",
            location="SP",
            platform="gupy",
            url=f"https://gupy.io/batch{i}",
            score=40,
            found_at=datetime.utcnow(),
        )
        db.add(job)
    await db.commit()

    resp = await client.post(
        "/api/v1/jobs/reject-batch",
        json={"jobIds": ["batch-job-0", "batch-job-2"], "reason": "empresa_ruim"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["deleted"] == 2

    # Verify batch-job-1 still exists
    resp_get = await client.get("/api/v1/jobs/batch-job-1")
    assert resp_get.status_code == 200

    # Verify batch-job-0 and batch-job-2 are gone
    assert (await client.get("/api/v1/jobs/batch-job-0")).status_code == 404
    assert (await client.get("/api/v1/jobs/batch-job-2")).status_code == 404


@pytest.mark.asyncio
async def test_list_rejected_jobs(client, db):
    from app.models.rejected_job import RejectedJob
    from datetime import datetime

    rj = RejectedJob(
        url="https://gupy.io/rej1",
        title="Rejected Job",
        company="Corp",
        location="SP",
        platform="gupy",
        score=20,
        reason="incompativel",
        rejected_at=datetime.utcnow(),
    )
    db.add(rj)
    await db.commit()

    resp = await client.get("/api/v1/jobs/rejected")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_update_rejected_reason(client, db):
    from app.models.rejected_job import RejectedJob
    from datetime import datetime

    rj = RejectedJob(
        id="rej-reason-1",
        url="https://gupy.io/rej2",
        title="Job",
        company="Corp",
        location="SP",
        platform="gupy",
        score=10,
        reason="incompativel",
        rejected_at=datetime.utcnow(),
    )
    db.add(rj)
    await db.commit()

    resp = await client.put(
        "/api/v1/jobs/rejected/rej-reason-1/reason",
        json={"reason": "salario_baixo"},
    )
    assert resp.status_code == 200
    assert resp.json()["reason"] == "salario_baixo"
