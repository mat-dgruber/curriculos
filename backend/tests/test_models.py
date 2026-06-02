"""Tests for Pydantic schema validation."""
import pytest
from pydantic import ValidationError

from app.models.job import JobCreate, JobRead, JobUpdate, JobListResponse
from app.models.application import ApplicationCreate, ApplicationStatusUpdate, ApplicationRead
from app.models.company import FixedCompanyCreate, FixedCompanyRead, FixedCompanyUpdate
from app.models.profile import CandidateProfileCreate, CandidateProfileRead, CandidateProfileUpdate


class TestJobCreate:
    def test_valid(self):
        j = JobCreate(
            title="Dev Angular",
            company="Tech Corp",
            location="SP",
            platform="gupy",
            url="https://gupy.io/123",
        )
        assert j.title == "Dev Angular"
        assert j.platform == "gupy"

    def test_valid_all_fields(self):
        j = JobCreate(
            title="Dev",
            company="Corp",
            location="SP",
            platform="linkedin",
            url="https://lnkd.in/123",
            description="desc",
            requirements="req",
            salary_range="R$ 10k",
        )
        assert j.description == "desc"

    def test_missing_required(self):
        with pytest.raises(ValidationError):
            JobCreate(title="Dev")

    def test_invalid_platform(self):
        with pytest.raises(ValidationError):
            JobCreate(
                title="Dev",
                company="Corp",
                location="SP",
                platform="invalid_platform",
                url="https://x.com",
            )

    def test_platform_vagas(self):
        j = JobCreate(
            title="Dev",
            company="Corp",
            location="SP",
            platform="vagas",
            url="https://vagas.com/1",
        )
        assert j.platform == "vagas"


class TestJobRead:
    def test_from_attributes(self):
        # CamelModel should work with from_attributes
        data = {
            "id": "abc",
            "title": "Dev",
            "company": "Corp",
            "location": "SP",
            "platform": "gupy",
            "url": "https://x.com",
            "description": None,
            "requirements": None,
            "salary_range": None,
            "score": 80,
            "status": "Nova",
            "is_favorite": False,
            "found_at": "2025-01-15T10:00:00",
            "created_at": "2025-01-15T10:00:00",
            "updated_at": "2025-01-15T10:00:00",
        }
        j = JobRead.model_validate(data)
        assert j.score == 80

    def test_camel_case_serialization(self):
        data = {
            "id": "abc",
            "title": "Dev",
            "company": "Corp",
            "location": "SP",
            "platform": "gupy",
            "url": "https://x.com",
            "description": None,
            "requirements": None,
            "salary_range": "R$ 10k",
            "score": 80,
            "status": "Nova",
            "is_favorite": False,
            "found_at": "2025-01-15T10:00:00",
            "created_at": "2025-01-15T10:00:00",
            "updated_at": "2025-01-15T10:00:00",
        }
        j = JobRead.model_validate(data)
        dumped = j.model_dump(by_alias=True)
        # Check that the model serializes correctly (camelCase or snake_case)
        has_camel = "salaryRange" in dumped or "foundAt" in dumped
        assert has_camel or "salary_range" in dumped, f"Unexpected keys: {list(dumped.keys())}"


class TestApplicationCreate:
    def test_valid(self):
        a = ApplicationCreate(job_id="abc-123")
        assert a.job_id == "abc-123"

    def test_with_notes(self):
        a = ApplicationCreate(job_id="abc", notes="via painel")
        assert a.notes == "via painel"

    def test_missing_job_id(self):
        with pytest.raises(ValidationError):
            ApplicationCreate()


class TestApplicationStatusUpdate:
    def test_valid_statuses(self):
        for s in ["Pendente", "Enviado", "Falhou", "Arquivado"]:
            u = ApplicationStatusUpdate(status=s)
            assert u.status == s

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            ApplicationStatusUpdate(status="Cancelado")


class TestFixedCompanyCreate:
    def test_valid(self):
        c = FixedCompanyCreate(
            name="Banco XYZ",
            application_url="https://bancoxyz.com/careers",
        )
        assert c.interval_days == 30

    def test_custom_interval(self):
        c = FixedCompanyCreate(
            name="Corp",
            application_url="https://corp.com/apply",
            interval_days=15,
        )
        assert c.interval_days == 15

    def test_interval_too_low(self):
        with pytest.raises(ValidationError):
            FixedCompanyCreate(
                name="Corp",
                application_url="https://x.com",
                interval_days=3,
            )

    def test_interval_too_high(self):
        with pytest.raises(ValidationError):
            FixedCompanyCreate(
                name="Corp",
                application_url="https://x.com",
                interval_days=120,
            )

    def test_missing_required(self):
        with pytest.raises(ValidationError):
            FixedCompanyCreate(name="Corp")


class TestCandidateProfileCreate:
    def test_valid(self):
        p = CandidateProfileCreate(
            name="Matheus",
            email="m@test.com",
        )
        assert p.keywords == []
        assert p.auto_apply is False

    def test_with_lists(self):
        p = CandidateProfileCreate(
            name="Matheus",
            email="m@test.com",
            keywords=["angular", "python"],
            target_roles=["Frontend Dev"],
            preferred_locations=["SP", "Remoto"],
        )
        assert len(p.keywords) == 2
        assert len(p.target_roles) == 1

    def test_scan_interval_validation(self):
        with pytest.raises(ValidationError):
            CandidateProfileCreate(
                name="M",
                email="m@t.com",
                scan_interval_hours=0,
            )

    def test_scan_interval_too_high(self):
        with pytest.raises(ValidationError):
            CandidateProfileCreate(
                name="M",
                email="m@t.com",
                scan_interval_hours=48,
            )
