from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as env_settings
from app.core.dependencies import require_admin
from app.database import get_db
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.settings import SystemSettingsOut, SystemSettingsUpdate

router = APIRouter(prefix='/settings', tags=['settings'])

SETTING_KEYS = {
    'face_threshold',
    'frame_interval_ms',
    'webhook_url',
    'webhook_enabled',
    'snapshot_retention_days',
}


def _defaults() -> dict[str, str]:
    return {
        'face_threshold': str(env_settings.face_similarity_threshold),
        'frame_interval_ms': str(env_settings.frame_interval_ms),
        'webhook_url': '',
        'webhook_enabled': 'false',
        'snapshot_retention_days': '30',
    }


def _coerce(values: dict[str, str]) -> SystemSettingsOut:
    defaults = _defaults()
    merged = {**defaults, **values}
    return SystemSettingsOut(
        face_threshold=float(merged['face_threshold']),
        frame_interval_ms=int(merged['frame_interval_ms']),
        webhook_url=merged['webhook_url'],
        webhook_enabled=merged['webhook_enabled'].lower() == 'true',
        snapshot_retention_days=int(merged['snapshot_retention_days']),
    )


async def _read_settings(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(SystemSetting).where(SystemSetting.key.in_(SETTING_KEYS)))
    return {row.key: row.value for row in result.scalars().all()}


@router.get('', response_model=SystemSettingsOut)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return _coerce(await _read_settings(db))


@router.put('', response_model=SystemSettingsOut)
async def update_settings(
    data: SystemSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    payload = {
        'face_threshold': str(data.face_threshold),
        'frame_interval_ms': str(data.frame_interval_ms),
        'webhook_url': str(data.webhook_url or ''),
        'webhook_enabled': 'true' if data.webhook_enabled else 'false',
        'snapshot_retention_days': str(data.snapshot_retention_days),
    }

    current = await _read_settings(db)
    for key, value in payload.items():
        if key in current:
            setting = await db.get(SystemSetting, key)
            if setting:
                setting.value = value
        else:
            db.add(SystemSetting(key=key, value=value))

    await db.commit()
    return _coerce(payload)
