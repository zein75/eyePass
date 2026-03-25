import uuid
from pydantic import BaseModel


class AccessRuleCreate(BaseModel):
    person_id: uuid.UUID
    zone_id: uuid.UUID
    time_from: str   # HH:MM
    time_to: str     # HH:MM
    days_of_week: list[int]  # 1=Пн .. 7=Вс


class AccessRuleOut(BaseModel):
    id: uuid.UUID
    person_id: uuid.UUID
    person_name: str
    zone_id: uuid.UUID
    zone_name: str
    time_from: str
    time_to: str
    days_of_week: list[int]
    is_active: bool

    model_config = {'from_attributes': True}
