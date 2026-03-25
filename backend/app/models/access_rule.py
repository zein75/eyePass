import uuid

from sqlalchemy import ARRAY, Boolean, ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AccessRule(Base):
    __tablename__ = 'access_rules'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    person_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey('persons.id', ondelete='CASCADE'), nullable=False
    )
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey('zones.id', ondelete='CASCADE'), nullable=False
    )
    time_from: Mapped[str] = mapped_column(Time, nullable=False)
    time_to: Mapped[str] = mapped_column(Time, nullable=False)
    days_of_week: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    person: Mapped['Person'] = relationship('Person', back_populates='rules')  # noqa: F821
    zone: Mapped['Zone'] = relationship('Zone', back_populates='rules')  # noqa: F821
