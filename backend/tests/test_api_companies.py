"""Tests for /api/v1/companies endpoints."""
import pytest


@pytest.mark.asyncio
async def test_list_companies_empty(client):
    resp = await client.get("/api/v1/companies")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_create_company(client):
    resp = await client.post(
        "/api/v1/companies",
        json={
            "name": "Banco XYZ",
            "applicationUrl": "https://bancoxyz.com/careers",
            "intervalDays": 30,
            "notes": "Formulário simples",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Banco XYZ"
    assert data["applicationUrl"] == "https://bancoxyz.com/careers"
    assert data["isActive"] is True
    assert data["status"] == "Ativo"
    assert data["totalSent"] == 0
    assert data["intervalDays"] == 30
    assert data["nextSendAt"] is not None


@pytest.mark.asyncio
async def test_create_company_default_interval(client):
    resp = await client.post(
        "/api/v1/companies",
        json={
            "name": "Corp",
            "applicationUrl": "https://corp.com/apply",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["intervalDays"] == 30


@pytest.mark.asyncio
async def test_update_company(client, db):
    from app.models.company import FixedCompany
    from datetime import datetime

    company = FixedCompany(
        id="update-company-1",
        name="Original Name",
        application_url="https://original.com/careers",
        status="Ativo",
        is_active=True,
        interval_days=30,
    )
    db.add(company)
    await db.commit()

    resp = await client.put(
        "/api/v1/companies/update-company-1",
        json={"name": "Updated Name", "intervalDays": 15},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Name"
    assert data["intervalDays"] == 15


@pytest.mark.asyncio
async def test_update_company_not_found(client):
    resp = await client.put(
        "/api/v1/companies/nonexistent",
        json={"name": "Nope"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_company(client, db):
    from app.models.company import FixedCompany

    company = FixedCompany(
        id="delete-company-1",
        name="To Delete",
        application_url="https://delete.com/careers",
    )
    db.add(company)
    await db.commit()

    resp = await client.delete("/api/v1/companies/delete-company-1")
    assert resp.status_code == 200
    assert "removida" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_delete_company_not_found(client):
    resp = await client.delete("/api/v1/companies/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_toggle_company(client, db):
    from app.models.company import FixedCompany

    company = FixedCompany(
        id="toggle-company-1",
        name="Toggle Corp",
        application_url="https://toggle.com/careers",
        status="Ativo",
        is_active=True,
        interval_days=30,
    )
    db.add(company)
    await db.commit()

    # Toggle off
    resp = await client.put("/api/v1/companies/toggle-company-1/toggle")
    assert resp.status_code == 200
    data = resp.json()
    assert data["isActive"] is False
    assert data["status"] == "Pausado"

    # Toggle back on
    resp2 = await client.put("/api/v1/companies/toggle-company-1/toggle")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["isActive"] is True
    assert data2["status"] == "Ativo"


@pytest.mark.asyncio
async def test_toggle_company_responded(client, db):
    from app.models.company import FixedCompany

    company = FixedCompany(
        id="responded-company-1",
        name="Responded Corp",
        application_url="https://responded.com/careers",
        status="Respondeu",
        is_active=False,
        interval_days=30,
    )
    db.add(company)
    await db.commit()

    resp = await client.put("/api/v1/companies/responded-company-1/toggle")
    assert resp.status_code == 409
    assert "respondeu" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_toggle_company_not_found(client):
    resp = await client.put("/api/v1/companies/nonexistent/toggle")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_record_sent(client, db):
    from app.models.company import FixedCompany

    company = FixedCompany(
        id="record-sent-1",
        name="Sent Corp",
        application_url="https://sent.com/careers",
        status="Ativo",
        is_active=True,
        interval_days=10,
        total_sent=2,
    )
    db.add(company)
    await db.commit()

    resp = await client.post("/api/v1/companies/record-sent-1/record-sent")
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalSent"] == 3
    assert data["lastSentAt"] is not None
    assert data["nextSendAt"] is not None


@pytest.mark.asyncio
async def test_record_sent_not_found(client):
    resp = await client.post("/api/v1/companies/nonexistent/record-sent")
    assert resp.status_code == 404
