import uuid
from pydantic import BaseModel


class ZoneCreate(BaseModel):
    name: str
    description: str | None = None


class ZoneOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None

    model_config = {'from_attributes': True}
