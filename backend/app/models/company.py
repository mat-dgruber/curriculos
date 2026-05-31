from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, Text, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FixedCompany(Base):
    __tablename__ = "fixed_companies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    application_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Ativo")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_send_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    applications: Mapped[list["Application"]] = relationship(
        back_populates="fixed_company"
    )

    __table_args__ = (
        Index("ix_fixed_companies_status", "status"),
        Index("ix_fixed_companies_is_active", "is_active"),
        Index("ix_fixed_companies_next_send_at", "next_send_at"),
    )


from pydantic import BaseModel, Field


class FixedCompanyCreate(BaseModel):
    name: str = Field(..., max_length=255)
    application_url: str = Field(..., max_length=1024)
    interval_days: int = Field(30, ge=7, le=90)
    notes: str | None = None


class FixedCompanyRead(BaseModel):
    id: str
    name: str
    application_url: str
    status: str
    is_active: bool
    interval_days: int
    last_sent_at: datetime | None
    next_send_at: datetime | None
    total_sent: int
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FixedCompanyUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    application_url: str | None = Field(None, max_length=1024)
    interval_days: int | None = Field(None, ge=7, le=90)
    notes: str | None = None


class FixedCompanyListResponse(BaseModel):
    items: list[FixedCompanyRead]
    total: int
    page: int
    per_page: int
    pages: int
