import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

Decision = Literal['allow', 'deny', 'unknown']


class AccessEventOut(BaseModel):
    id: uuid.UUID
    person_id: uuid.UUID | None
    person_name: str | None
    camera_id: uuid.UUID
    camera_name: str
    zone_id: uuid.UUID
    zone_name: str
    decision: Decision
    confidence: float | None
    snapshot_url: str | None
    created_at: datetime

    model_config = {'from_attributes': True}


class EventPageOut(BaseModel):
    items: list[AccessEventOut]
    total: int
    page: int
    page_size: int
    pages: int


class DashboardStats(BaseModel):
    total_persons: int
    active_persons: int
    total_cameras: int
    running_cameras: int
    events_today: int
    allow_today: int
    deny_today: int
    unknown_today: int


class HourlyStats(BaseModel):
    hour: int
    allow: int
    deny: int
    unknown: int
