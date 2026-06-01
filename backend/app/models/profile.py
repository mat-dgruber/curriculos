from datetime import datetime
from uuid import uuid4
import json

from sqlalchemy import String, Integer, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.schema import CamelModel


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cv_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cv_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_roles: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_locations: Mapped[str | None] = mapped_column(Text, nullable=True)
    scan_interval_hours: Mapped[int] = mapped_column(
        Integer, nullable=False, default=6
    )
    auto_apply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    auto_delete_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def get_keywords_list(self) -> list[str]:
        return json.loads(self.keywords) if self.keywords else []

    def get_target_roles_list(self) -> list[str]:
        return json.loads(self.target_roles) if self.target_roles else []

    def get_preferred_locations_list(self) -> list[str]:
        return json.loads(self.preferred_locations) if self.preferred_locations else []


from pydantic import Field


class CandidateProfileCreate(CamelModel):
    name: str = Field(..., max_length=255)
    email: str = Field(..., max_length=255)
    phone: str | None = Field(None, max_length=50)
    location: str | None = Field(None, max_length=255)
    target_role: str | None = Field(None, max_length=255)
    linkedin_url: str | None = Field(None, max_length=512)
    keywords: list[str] = Field(default_factory=list)
    target_roles: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    scan_interval_hours: int = Field(6, ge=1, le=24)
    auto_apply: bool = False
    auto_delete_days: int = Field(30, ge=0, le=365)


class CandidateProfileRead(CamelModel):
    id: str
    name: str
    email: str
    phone: str | None
    location: str | None
    target_role: str | None
    linkedin_url: str | None
    cv_filename: str | None
    cv_uploaded_at: datetime | None
    keywords: list[str] = Field(default_factory=list)
    target_roles: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    scan_interval_hours: int
    auto_apply: bool
    auto_delete_days: int
    created_at: datetime
    updated_at: datetime


class CandidateProfileUpdate(CamelModel):
    name: str | None = Field(None, max_length=255)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    location: str | None = Field(None, max_length=255)
    target_role: str | None = Field(None, max_length=255)
    linkedin_url: str | None = Field(None, max_length=512)
    keywords: list[str] | None = None
    target_roles: list[str] | None = None
    preferred_locations: list[str] | None = None
    scan_interval_hours: int | None = Field(None, ge=1, le=24)
    auto_apply: bool | None = None
    auto_delete_days: int | None = Field(None, ge=0, le=365)
