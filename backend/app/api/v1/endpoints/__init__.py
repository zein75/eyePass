import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneOut

router = APIRouter(prefix='/zones', tags=['zones'])


@router.get('', response_model=list[ZoneOut])
async def list_zones(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Zone).order_by(Zone.name))
    return result.scalars().all()


@router.post('', response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
async def create_zone(
    data: ZoneCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    zone = Zone(**data.model_dump())
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone


@router.delete('/{zone_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_zone(
    zone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail='Зона не найдена')
    await db.delete(zone)
    await db.commit()
