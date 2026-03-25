import math
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.access_event import AccessEvent
from app.models.camera import Camera
from app.models.person import Person
from app.schemas.event import AccessEventOut, DashboardStats, EventPageOut, HourlyStats

router = APIRouter(prefix='/events', tags=['events'])


def _to_out(e: AccessEvent) -> AccessEventOut:
    return AccessEventOut(
        id=e.id,
        person_id=e.person_id,
        person_name=e.person.full_name if e.person else None,
        camera_id=e.camera_id,
        camera_name=e.camera.name if e.camera else '',
        zone_id=e.zone_id,
        zone_name=e.zone.name if e.zone else '',
        decision=e.decision,
        confidence=e.confidence,
        snapshot_url=e.snapshot_url,
        created_at=e.created_at,
    )


@router.get('', response_model=EventPageOut)
async def list_events(
    page: int = 1,
    page_size: int = 25,
    zone_id: uuid.UUID | None = None,
    decision: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = (
        select(AccessEvent)
        .options(
            selectinload(AccessEvent.person),
            selectinload(AccessEvent.camera),
            selectinload(AccessEvent.zone),
        )
        .order_by(AccessEvent.created_at.desc())
    )

    if zone_id:
        q = q.where(AccessEvent.zone_id == zone_id)
    if decision:
        q = q.where(AccessEvent.decision == decision)
    if date_from:
        q = q.where(AccessEvent.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.where(AccessEvent.created_at <= datetime.fromisoformat(date_to))

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    result = await db.execute(q.offset((page - 1) * page_size).limit(page_size))
    events = result.scalars().all()

    return EventPageOut(
        items=[_to_out(e) for e in events],
        total=total or 0,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil((total or 0) / page_size)),
    )


@router.get('/stats', response_model=DashboardStats)
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    from app.models.person import Person as PersonModel

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_persons  = await db.scalar(select(func.count(PersonModel.id))) or 0
    active_persons = await db.scalar(select(func.count(PersonModel.id)).where(PersonModel.is_active.is_(True))) or 0
    total_cameras  = await db.scalar(select(func.count(Camera.id))) or 0
    running_cameras= await db.scalar(select(func.count(Camera.id)).where(Camera.is_running.is_(True))) or 0

    events_today   = await db.scalar(select(func.count(AccessEvent.id)).where(AccessEvent.created_at >= today_start)) or 0
    allow_today    = await db.scalar(select(func.count(AccessEvent.id)).where(AccessEvent.created_at >= today_start, AccessEvent.decision == 'allow')) or 0
    deny_today     = await db.scalar(select(func.count(AccessEvent.id)).where(AccessEvent.created_at >= today_start, AccessEvent.decision == 'deny')) or 0
    unknown_today  = await db.scalar(select(func.count(AccessEvent.id)).where(AccessEvent.created_at >= today_start, AccessEvent.decision == 'unknown')) or 0

    return DashboardStats(
        total_persons=total_persons,
        active_persons=active_persons,
        total_cameras=total_cameras,
        running_cameras=running_cameras,
        events_today=events_today,
        allow_today=allow_today,
        deny_today=deny_today,
        unknown_today=unknown_today,
    )


@router.get('/stats/hourly', response_model=list[HourlyStats])
async def hourly_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(
            func.extract('hour', AccessEvent.created_at).label('hour'),
            AccessEvent.decision,
            func.count().label('cnt'),
        )
        .where(AccessEvent.created_at >= today_start)
        .group_by('hour', AccessEvent.decision)
        .order_by('hour')
    )
    rows = result.all()

    hourly: dict[int, dict] = {h: {'hour': h, 'allow': 0, 'deny': 0, 'unknown': 0} for h in range(24)}
    for row in rows:
        h = int(row.hour)
        hourly[h][row.decision] = row.cnt

    return [HourlyStats(**v) for v in hourly.values()]
