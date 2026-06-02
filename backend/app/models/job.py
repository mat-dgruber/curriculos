from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, Text, DateTime, Index, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.schema import CamelModel


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    salary_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Nova")
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    found_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    applications: Mapped[list["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_score", "score"),
        Index("ix_jobs_platform", "platform"),
        Index("ix_jobs_found_at", "found_at"),
        Index("ix_jobs_platform_status", "platform", "status"),
    )


from pydantic import Field


class JobCreate(CamelModel):
    title: str = Field(..., max_length=255)
    company: str = Field(..., max_length=255)
    location: str = Field(..., max_length=255)
    platform: str = Field(..., pattern=r"^(linkedin|gupy|vagas|jooble|adzuna|remotive|infojobs|catho)$")
    url: str = Field(..., max_length=1024)
    description: str | None = None
    requirements: str | None = None
    salary_range: str | None = Field(None, max_length=100)
    is_favorite: bool = False


class JobRead(CamelModel):
    id: str
    title: str
    company: str
    location: str
    platform: str
    url: str
    description: str | None
    requirements: str | None
    salary_range: str | None
    score: int
    status: str
    is_favorite: bool
    found_at: datetime
    created_at: datetime
    updated_at: datetime


class JobUpdate(CamelModel):
    title: str | None = Field(None, max_length=255)
    company: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    platform: str | None = Field(None, pattern=r"^(linkedin|gupy|vagas|jooble|adzuna|remotive|infojobs|catho)$")
    url: str | None = Field(None, max_length=1024)
    description: str | None = None
    requirements: str | None = None
    salary_range: str | None = Field(None, max_length=100)
    score: int | None = Field(None, ge=0, le=100)
    status: str | None = Field(None, pattern=r"^(Nova|Visualizada|Candidatou)$")
    is_favorite: bool | None = Field(None)


class JobListResponse(CamelModel):
    items: list[JobRead]
    total: int
    page: int
    per_page: int
    pages: int
