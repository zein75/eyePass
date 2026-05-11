import uuid
from pydantic import BaseModel


class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    zone_id: uuid.UUID


class CameraOut(BaseModel):
    id: uuid.UUID
    name: str
    rtsp_url: str
    zone_id: uuid.UUID | None
    zone_name: str = ''
    is_active: bool
    is_running: bool
    error: str | None = None

    model_config = {'from_attributes': True}
