import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AccessEvent(Base):
    __tablename__ = 'access_events'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    person_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey('persons.id', ondelete='SET NULL'), nullable=True
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey('cameras.id', ondelete='CASCADE'), nullable=False
    )
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey('zones.id', ondelete='CASCADE'), nullable=False
    )
    decision: Mapped[str] = mapped_column(
        Enum('allow', 'deny', 'unknown', name='decision_type'), nullable=False
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    snapshot_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    person: Mapped['Person'] = relationship('Person', back_populates='events')  # noqa: F821
    camera: Mapped['Camera'] = relationship('Camera', back_populates='events')  # noqa: F821
    zone: Mapped['Zone'] = relationship('Zone', back_populates='events')  # noqa: F821
