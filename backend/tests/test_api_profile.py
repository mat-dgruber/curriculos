"""Tests for /api/v1/profile endpoints."""
import pytest
import json


@pytest.mark.asyncio
async def test_get_profile_not_found(client):
    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 404
    assert "perfil" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_profile_not_found(client):
    resp = await client.put(
        "/api/v1/profile",
        json={"name": "Test"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_profile_after_create(client, db):
    from app.models.profile import CandidateProfile

    profile = CandidateProfile(
        id="test-profile-1",
        name="Matheus Diniz",
        email="matheus@test.com",
        phone="+55 11 99999-0000",
        location="São Paulo, SP",
        target_role="Desenvolvedor Angular/Python",
        linkedin_url="https://linkedin.com/in/matheus",
        keywords=json.dumps(["angular", "python", "typescript"]),
        target_roles=json.dumps(["Desenvolvedor Frontend"]),
        preferred_locations=json.dumps(["São Paulo", "Remoto"]),
        scan_interval_hours=6,
        auto_apply=False,
    )
    db.add(profile)
    await db.commit()

    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Matheus Diniz"
    assert data["email"] == "matheus@test.com"
    assert data["keywords"] == ["angular", "python", "typescript"]
    assert data["targetRoles"] == ["Desenvolvedor Frontend"]
    assert data["preferredLocations"] == ["São Paulo", "Remoto"]
    assert data["scanIntervalHours"] == 6
    assert data["autoApply"] is False


@pytest.mark.asyncio
async def test_update_profile(client, db):
    from app.models.profile import CandidateProfile

    profile = CandidateProfile(
        id="test-profile-2",
        name="Old Name",
        email="old@test.com",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    resp = await client.put(
        "/api/v1/profile",
        json={
            "name": "New Name",
            "keywords": ["angular", "react"],
            "scanIntervalHours": 12,
            "autoApply": True,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "New Name"
    assert data["keywords"] == ["angular", "react"]
    assert data["scanIntervalHours"] == 12
    assert data["autoApply"] is True
    # email unchanged
    assert data["email"] == "old@test.com"


@pytest.mark.asyncio
async def test_upload_cv(client):
    import io

    file_content = b"%PDF-1.4 fake pdf content"
    resp = await client.post(
        "/api/v1/profile/cv",
        files={"file": ("curriculo.pdf", io.BytesIO(file_content), "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["filename"] == "curriculo.pdf"
    assert "sucesso" in data["message"].lower()
