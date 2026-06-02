from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.schema import CamelModel


class ApplicationClick(Base):
    __tablename__ = "application_clicks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), nullable=False
    )
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_application_clicks_application_id", "application_id"),
        Index("ix_application_clicks_clicked_at", "clicked_at"),
    )


class ApplicationClickRead(CamelModel):
    id: str
    application_id: str
    clicked_at: datetime
