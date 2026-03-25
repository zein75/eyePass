import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class PersonCreate(BaseModel):
    full_name: str
    phone: str | None = None
    email: EmailStr | None = None


class PersonUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None


class PersonOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str | None
    email: str | None
    photo_url: str | None
    is_active: bool
    created_at: datetime
    has_face: bool = False

    model_config = {'from_attributes': True}


class PageOut(BaseModel):
    items: list[PersonOut]
    total: int
    page: int
    page_size: int
    pages: int
