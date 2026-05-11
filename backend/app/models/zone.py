import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Zone(Base):
    __tablename__ = 'zones'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    cameras: Mapped[list['Camera']] = relationship('Camera', back_populates='zone')
    rules: Mapped[list['AccessRule']] = relationship('AccessRule', back_populates='zone')
    events: Mapped[list['AccessEvent']] = relationship('AccessEvent', back_populates='zone')

