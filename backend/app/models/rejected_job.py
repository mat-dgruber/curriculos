from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, Text, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.schema import CamelModel


class RejectedJob(Base):
    __tablename__ = "rejected_jobs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    original_job_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reason: Mapped[str] = mapped_column(String(50), nullable=False, default="incompativel")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejected_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_rejected_jobs_url", "url"),
        Index("ix_rejected_jobs_rejected_at", "rejected_at"),
    )


REJECTION_REASONS = [
    "incompativel",
    "empresa_ruim",
    "sem_remote",
    "salario_baixo",
    "local_incompativel",
    "auto_delete",
    "outro",
]


class RejectedJobCreate(CamelModel):
    url: str
    title: str
    company: str
    location: str
    platform: str
    score: int = 0
    reason: str = "incompativel"
    notes: str | None = None


class RejectedJobRead(CamelModel):
    id: str
    original_job_id: str | None
    url: str
    title: str
    company: str
    location: str
    platform: str
    score: int
    reason: str
    notes: str | None
    rejected_at: datetime


class RejectRequest(CamelModel):
    reason: str = "incompativel"
    notes: str | None = None


class RejectBatchRequest(CamelModel):
    job_ids: list[str]
    reason: str = "incompativel"
    notes: str | None = None
