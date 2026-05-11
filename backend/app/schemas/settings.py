from pydantic import AnyHttpUrl, BaseModel, Field


class SystemSettingsOut(BaseModel):
    face_threshold: float = Field(ge=0.0, le=1.0)
    frame_interval_ms: int = Field(ge=100, le=60_000)
    webhook_url: str = ''
    webhook_enabled: bool = False
    snapshot_retention_days: int = Field(ge=1, le=3650)


class SystemSettingsUpdate(BaseModel):
    face_threshold: float = Field(ge=0.0, le=1.0)
    frame_interval_ms: int = Field(ge=100, le=60_000)
    webhook_url: AnyHttpUrl | str = ''
    webhook_enabled: bool = False
    snapshot_retention_days: int = Field(ge=1, le=3650)
