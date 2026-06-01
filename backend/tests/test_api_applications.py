"""Tests for /api/v1/applications endpoints."""
import pytest


@pytest.mark.asyncio
async def test_list_applications_empty(client):
    resp = await client.get("/api/v1/applications")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_create_application(client, db):
    from app.models.job import Job
    from datetime import datetime

    job = Job(
        id="app-test-job-1",
        title="Dev Angular",
        company="Tech Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/app1",
        score=80,
        found_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()

    resp = await client.post(
        "/api/v1/applications",
        json={"jobId": "app-test-job-1"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["jobId"] == "app-test-job-1"
    assert data["companyName"] == "Tech Corp"
    assert data["status"] == "Pendente"


@pytest.mark.asyncio
async def test_create_application_job_not_found(client):
    resp = await client.post(
        "/api/v1/applications",
        json={"jobId": "nonexistent"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_application_duplicate(client, db):
    from app.models.job import Job
    from app.models.application import Application
    from datetime import datetime

    job = Job(
        id="dup-job-1",
        title="Dev",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/dup1",
        score=50,
        found_at=datetime.utcnow(),
    )
    db.add(job)

    app = Application(
        id="dup-app-1",
        job_id="dup-job-1",
        company_name="Corp",
        status="Pendente",
    )
    db.add(app)
    await db.commit()

    resp = await client.post(
        "/api/v1/applications",
        json={"jobId": "dup-job-1"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_application_status(client, db):
    from app.models.job import Job
    from app.models.application import Application
    from datetime import datetime

    job = Job(
        id="status-job-1",
        title="Dev",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/status1",
        score=50,
        found_at=datetime.utcnow(),
    )
    db.add(job)

    app = Application(
        id="status-app-1",
        job_id="status-job-1",
        company_name="Corp",
        status="Pendente",
    )
    db.add(app)
    await db.commit()

    resp = await client.put(
        "/api/v1/applications/status-app-1/status",
        json={"status": "Enviado"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Enviado"
    assert data["sentAt"] is not None


@pytest.mark.asyncio
async def test_update_application_invalid_transition(client, db):
    from app.models.job import Job
    from app.models.application import Application
    from datetime import datetime

    job = Job(
        id="trans-job-1",
        title="Dev",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/trans1",
        score=50,
        found_at=datetime.utcnow(),
    )
    db.add(job)

    app = Application(
        id="trans-app-1",
        job_id="trans-job-1",
        company_name="Corp",
        status="Enviado",
    )
    db.add(app)
    await db.commit()

    # Enviado -> Pendente is not allowed
    resp = await client.put(
        "/api/v1/applications/trans-app-1/status",
        json={"status": "Pendente"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_application_not_found(client):
    resp = await client.put(
        "/api/v1/applications/nonexistent/status",
        json={"status": "Enviado"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_archive_application(client, db):
    from app.models.job import Job
    from app.models.application import Application
    from datetime import datetime

    job = Job(
        id="archive-job-1",
        title="Dev",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/archive1",
        score=50,
        found_at=datetime.utcnow(),
    )
    db.add(job)

    app = Application(
        id="archive-app-1",
        job_id="archive-job-1",
        company_name="Corp",
        status="Pendente",
    )
    db.add(app)
    await db.commit()

    resp = await client.delete("/api/v1/applications/archive-app-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Arquivado"
    assert data["id"] == "archive-app-1"


@pytest.mark.asyncio
async def test_archive_application_already_archived(client, db):
    from app.models.job import Job
    from app.models.application import Application
    from datetime import datetime

    job = Job(
        id="archive-job-2",
        title="Dev",
        company="Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/archive2",
        score=50,
        found_at=datetime.utcnow(),
    )
    db.add(job)

    app = Application(
        id="archive-app-2",
        job_id="archive-job-2",
        company_name="Corp",
        status="Arquivado",
    )
    db.add(app)
    await db.commit()

    resp = await client.delete("/api/v1/applications/archive-app-2")
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_archive_application_not_found(client):
    resp = await client.delete("/api/v1/applications/nonexistent")
    assert resp.status_code == 404
