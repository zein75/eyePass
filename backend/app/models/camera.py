import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Camera(Base):
    __tablename__ = 'cameras'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    rtsp_url: Mapped[str] = mapped_column(String(512), nullable=False)
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey('zones.id', ondelete='SET NULL'), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_running: Mapped[bool] = mapped_column(Boolean, default=False)

    zone: Mapped['Zone'] = relationship('Zone', back_populates='cameras')
    events: Mapped[list['AccessEvent']] = relationship('AccessEvent', back_populates='camera')

