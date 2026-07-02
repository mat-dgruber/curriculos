from datetime import datetime
from uuid import uuid4

from typing import TYPE_CHECKING

from pydantic import Field
from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.schema import CamelModel

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.company import FixedCompany



class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id"), nullable=False
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pendente")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    screenshot_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    fixed_company_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("fixed_companies.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    job: Mapped["Job"] = relationship(back_populates="applications")  # noqa: F821
    fixed_company: Mapped["FixedCompany | None"] = relationship(  # noqa: F821
        back_populates="applications"
    )

    __table_args__ = (
        Index("ix_applications_status", "status"),
        Index("ix_applications_sent_at", "sent_at"),
        Index("ix_applications_job_id", "job_id"),
        Index("ix_applications_is_recurring", "is_recurring"),
    )

class ApplicationCreate(CamelModel):
    job_id: str = Field(..., max_length=36)
    notes: str | None = None


class ApplicationRead(CamelModel):
    id: str
    job_id: str
    job_title: str = ""
    company_name: str
    status: str
    sent_at: datetime | None
    is_recurring: bool
    screenshot_path: str | None
    error_message: str | None
    notes: str | None
    fixed_company_id: str | None
    click_count: int = 0
    created_at: datetime
    updated_at: datetime


class ApplicationStatusUpdate(CamelModel):
    status: str = Field(
        ..., pattern=r"^(Pendente|Enviado|Falhou|Arquivado)$"
    )
    notes: str | None = None


class ApplicationListResponse(CamelModel):
    items: list[ApplicationRead]
    total: int
    page: int
    per_page: int
    pages: int
