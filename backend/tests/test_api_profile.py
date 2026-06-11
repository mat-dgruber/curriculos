"""Tests for /api/v1/profile endpoints."""

import pytest
import json


@pytest.mark.asyncio
async def test_get_profile_not_found(client):
    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 404
    assert "perfil" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_profile(client, db):
    # Create profile
    payload = {
        "name": "Novo Perfil",
        "email": "novo@perfil.com",
        "phone": "+55 11 99999-9999",
        "location": "São Paulo, SP",
        "targetRole": "Engenheiro de Software",
        "linkedinUrl": "https://linkedin.com/in/novoperfil",
        "keywords": ["python", "angular"],
        "targetRoles": ["Desenvolvedor Backend"],
        "preferredLocations": ["Remoto"],
        "scanIntervalHours": 6,
        "autoApply": False,
        "autoDeleteDays": 30,
    }
    resp = await client.post("/api/v1/profile", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Novo Perfil"
    assert data["email"] == "novo@perfil.com"
    assert data["keywords"] == ["python", "angular"]
    assert data["targetRoles"] == ["Desenvolvedor Backend"]

    # Re-retrieve profile - should be 200 now
    resp = await client.get("/api/v1/profile")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Novo Perfil"

    # Try creating again - should fail with 400 (profile already exists)
    resp = await client.post("/api/v1/profile", json=payload)
    assert resp.status_code == 400


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
async def test_upload_cv(client, db):
    from app.models.profile import CandidateProfile

    profile = CandidateProfile(
        id="test-profile-cv",
        name="CV User",
        email="cv@test.com",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    import io

    file_content = b"%PDF-1.4 fake pdf content"
    resp = await client.post(
        "/api/v1/profile/cv",
        files={"file": ("curriculo.pdf", io.BytesIO(file_content), "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["filename"] == "curriculo.pdf"
    assert data["size_bytes"] == len(file_content)
    assert "sucesso" in data["message"].lower()

    # Verify database was updated
    await db.refresh(profile)
    assert profile.cv_filename == "curriculo.pdf"
    assert profile.cv_uploaded_at is not None


@pytest.mark.asyncio
async def test_upload_cv_rejects_non_pdf(client, db):
    from app.models.profile import CandidateProfile

    profile = CandidateProfile(
        id="test-profile-cv2",
        name="CV User 2",
        email="cv2@test.com",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    import io

    file_content = b"this is not a pdf"
    resp = await client.post(
        "/api/v1/profile/cv",
        files={
            "file": (
                "curriculo.docx",
                io.BytesIO(file_content),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert resp.status_code == 415
    assert "pdf" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_cv_rejects_oversized_file(client, db):
    from app.models.profile import CandidateProfile

    profile = CandidateProfile(
        id="test-profile-cv3",
        name="CV User 3",
        email="cv3@test.com",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    import io

    # Create a file slightly over 10 MB
    oversized_content = b"%PDF-1.4 " + b"x" * (10 * 1024 * 1024 + 1)
    resp = await client.post(
        "/api/v1/profile/cv",
        files={
            "file": ("curriculo.pdf", io.BytesIO(oversized_content), "application/pdf")
        },
    )
    assert resp.status_code == 413
    assert "10 mb" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_cv_rejects_fake_pdf_signature(client, db):
    from app.models.profile import CandidateProfile

    profile = CandidateProfile(
        id="test-profile-cv4",
        name="CV User 4",
        email="cv4@test.com",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    import io

    # MIME is application/pdf, but contents are plain HTML/Text
    fake_content = b"<html><body>Malicious HTML disguised as PDF</body></html>"
    resp = await client.post(
        "/api/v1/profile/cv",
        files={"file": ("curriculo.pdf", io.BytesIO(fake_content), "application/pdf")},
    )
    assert resp.status_code == 415
    assert "inválido" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cv_suggestions_fallback_profile_fields(client, db):
    from app.models.profile import CandidateProfile

    # Create profile with no CV, but with specific target role and keywords
    profile = CandidateProfile(
        id="test-profile-suggestions",
        name="Suggestions User",
        email="suggestions@test.com",
        target_role="Desenvolvedor Python",
        keywords=json.dumps(["Docker", "FastAPI"]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps(["Remoto"]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    resp = await client.get("/api/v1/profile/cv-suggestions")
    assert resp.status_code == 200
    data = resp.json()

    # Since they have Python & FastAPI in profile text simulation,
    # the algorithm must suggest Python and FastAPI as keywords, and Desenvolvedor Backend as role.
    assert "Python" in data["keywords"]
    assert "FastAPI" in data["keywords"]
    assert "Docker" in data["keywords"]
    # Check expansions (since Python was found -> FastAPI/Django/PostgreSQL/Docker/SQL are expanded)
    assert "PostgreSQL" in data["keywords"]
    assert "Desenvolvedor Backend" in data["target_roles"]
    assert "Remoto" in data["preferred_locations"]


@pytest.mark.asyncio
async def test_cv_suggestions_nearby_cities_cluster(client, db):
    from app.models.profile import CandidateProfile

    # Create profile with location in Tatuí, SP
    profile = CandidateProfile(
        id="test-profile-tatui",
        name="Tatui User",
        email="tatui@test.com",
        location="Tatuí, SP",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    resp = await client.get("/api/v1/profile/cv-suggestions")
    assert resp.status_code == 200
    data = resp.json()

    # The algorithm must detect Tatuí and return nearby cities as suggestions
    assert "Tatuí, SP" in data["preferred_locations"]
    assert "Boituva, SP" in data["preferred_locations"]
    assert "Sorocaba, SP" in data["preferred_locations"]
    assert "Itapetininga, SP" in data["preferred_locations"]
    assert "Híbrido (SP)" in data["preferred_locations"]
    assert "Remoto" in data["preferred_locations"]


@pytest.mark.asyncio
async def test_cv_suggestions_non_it_role(client, db):
    from app.models.profile import CandidateProfile

    # Create profile with a target role in HR/RH
    profile = CandidateProfile(
        id="test-profile-rh",
        name="RH User",
        email="rh@test.com",
        target_role="Auxiliar de RH",
        keywords=json.dumps([]),
        target_roles=json.dumps([]),
        preferred_locations=json.dumps([]),
        scan_interval_hours=6,
    )
    db.add(profile)
    await db.commit()

    resp = await client.get("/api/v1/profile/cv-suggestions")
    assert resp.status_code == 200
    data = resp.json()

    # The suggestions should contain HR/RH related terms
    assert "Recrutamento" in data["keywords"]
    assert "Departamento Pessoal" in data["keywords"]
    assert "Auxiliar de RH" in data["target_roles"]
    assert "Analista de RH" in data["target_roles"]
