import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Person(Base):
    __tablename__ = 'persons'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(256), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(256), unique=True, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    face_embeddings: Mapped[list['FaceEmbedding']] = relationship(  # noqa: F821
        'FaceEmbedding', back_populates='person', cascade='all, delete-orphan'
    )
    rules: Mapped[list['AccessRule']] = relationship('AccessRule', back_populates='person')  # noqa: F821
    events: Mapped[list['AccessEvent']] = relationship('AccessEvent', back_populates='person')  # noqa: F821
