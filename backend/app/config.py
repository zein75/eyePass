from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    database_url: str = 'postgresql+asyncpg://eyepass:secret@postgres:5432/eyepass_db'

    redis_url: str = 'redis://redis:6379/0'

    secret_key: str = 'change-me-in-production'
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    face_service_url: str = 'http://face_service:8001'
    face_similarity_threshold: float = 0.40
    face_min_detection_confidence: float = 0.85

    frame_interval_ms: int = 500
    snapshot_dir: str = '/data/snapshots'

    webhook_timeout_seconds: int = 5
    webhook_max_retries: int = 3


settings = Settings()
