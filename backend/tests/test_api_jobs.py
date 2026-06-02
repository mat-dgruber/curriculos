"""Tests for /api/v1/jobs endpoints."""
import pytest


@pytest.mark.asyncio
async def test_list_jobs_empty(client):
    resp = await client.get("/api/v1/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["page"] == 1
    assert data["perPage"] == 20


@pytest.mark.asyncio
async def test_list_jobs_with_data(client, db):
    from app.models.job import Job
    from datetime import datetime

    job = Job(
        id="test-job-1",
        title="Desenvolvedor Angular",
        company="Tech Corp",
        location="São Paulo",
        platform="linkedin",
        url="https://linkedin.com/123",
        score=85,
        status="Nova",
        found_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()

    resp = await client.get("/api/v1/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Desenvolvedor Angular"
    assert data["items"][0]["score"] == 85
    assert data["items"][0]["platform"] == "linkedin"
    # Check camelCase in response
    assert "salaryRange" in data["items"][0]
    assert "foundAt" in data["items"][0]


@pytest.mark.asyncio
async def test_list_jobs_filter_platform(client, db):
    from app.models.job import Job
    from datetime import datetime

    for i, plat in enumerate(["linkedin", "gupy", "vagas"]):
        job = Job(
            id=f"filter-job-{i}",
            title=f"Job {plat}",
            company="Corp",
            location="SP",
            platform=plat,
            url=f"https://{plat}.com/{i}",
            score=50,
            found_at=datetime.utcnow(),
        )
        db.add(job)
    await db.commit()

    resp = await client.get("/api/v1/jobs?platform=linkedin")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["platform"] == "linkedin"


@pytest.mark.asyncio
async def test_list_jobs_filter_favorite(client, db):
    from app.models.job import Job
    from datetime import datetime

    job_fav = Job(
        id="fav-job-yes",
        title="Job Favorito",
        company="Corp",
        location="SP",
        platform="linkedin",
        url="https://linkedin.com/fav-yes",
        score=50,
        is_favorite=True,
        found_at=datetime.utcnow(),
    )
    job_not_fav = Job(
        id="fav-job-no",
        title="Job Nao Favorito",
        company="Corp",
        location="SP",
        platform="linkedin",
        url="https://linkedin.com/fav-no",
        score=50,
        is_favorite=False,
        found_at=datetime.utcnow(),
    )
    db.add_all([job_fav, job_not_fav])
    await db.commit()

    resp = await client.get("/api/v1/jobs?is_favorite=true")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == "fav-job-yes"

    resp_all = await client.get("/api/v1/jobs")
    assert resp_all.status_code == 200
    data_all = resp_all.json()
    assert data_all["total"] >= 2


@pytest.mark.asyncio
async def test_list_jobs_filter_min_score(client, db):
    from app.models.job import Job
    from datetime import datetime

    for i, score in enumerate([30, 60, 90]):
        job = Job(
            id=f"score-job-{i}",
            title=f"Job score {score}",
            company="Corp",
            location="SP",
            platform="gupy",
            url=f"https://gupy.io/{i}",
            score=score,
            found_at=datetime.utcnow(),
        )
        db.add(job)
    await db.commit()

    resp = await client.get("/api/v1/jobs?min_score=60")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_list_jobs_filter_search(client, db):
    from app.models.job import Job
    from datetime import datetime

    job = Job(
        id="search-job-1",
        title="Desenvolvedor Python",
        company="Python Corp",
        location="SP",
        platform="gupy",
        url="https://gupy.io/search1",
        score=50,
        found_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()

    resp = await client.get("/api/v1/jobs?search=Python")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_jobs_pagination(client, db):
    from app.models.job import Job
    from datetime import datetime

    for i in range(25):
        job = Job(
            id=f"page-job-{i}",
            title=f"Job {i}",
            company="Corp",
            location="SP",
            platform="gupy",
            url=f"https://gupy.io/page{i}",
            score=50,
            found_at=datetime.utcnow(),
        )
        db.add(job)
    await db.commit()

    resp = await client.get("/api/v1/jobs?per_page=10&page=1")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 10
    assert data["total"] == 25
    assert data["pages"] == 3

    resp2 = await client.get("/api/v1/jobs?per_page=10&page=3")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2["items"]) == 5


@pytest.mark.asyncio
async def test_get_job_found(client, db):
    from app.models.job import Job
    from datetime import datetime

    job = Job(
        id="detail-job-1",
        title="Dev Angular",
        company="Tech",
        location="SP",
        platform="linkedin",
        url="https://lnkd.in/detail",
        description="Descrição da vaga",
        score=90,
        status="Nova",
        found_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()

    resp = await client.get("/api/v1/jobs/detail-job-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Dev Angular"
    assert data["description"] == "Descrição da vaga"


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    resp = await client.get("/api/v1/jobs/nonexistent-id")
    assert resp.status_code == 404
    assert "não encontrado" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_trigger_scan(client):
    resp = await client.post("/api/v1/jobs/scan")
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "running"
    assert "Varredura" in data["message"]
