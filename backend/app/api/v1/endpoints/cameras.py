import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraOut

router = APIRouter(prefix='/cameras', tags=['cameras'])


def _to_out(c: Camera) -> CameraOut:
    return CameraOut(
        id=c.id,
        name=c.name,
        rtsp_url=c.rtsp_url,
        zone_id=c.zone_id,
        zone_name=c.zone.name if c.zone else '',
        is_active=c.is_active,
        is_running=c.is_running,
    )


@router.get('', response_model=list[CameraOut])
async def list_cameras(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Camera).options(selectinload(Camera.zone)).order_by(Camera.name))
    return [_to_out(c) for c in result.scalars().all()]


@router.post('', response_model=CameraOut, status_code=status.HTTP_201_CREATED)
async def create_camera(
    data: CameraCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    camera = Camera(**data.model_dump())
    db.add(camera)
    await db.commit()
    await db.refresh(camera, ['zone'])
    return _to_out(camera)


@router.put('/{camera_id}', response_model=CameraOut)
async def update_camera(
    camera_id: uuid.UUID,
    data: CameraCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id).options(selectinload(Camera.zone)))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail='Камера не найдена')
    for field, value in data.model_dump().items():
        setattr(camera, field, value)
    await db.commit()
    await db.refresh(camera, ['zone'])
    return _to_out(camera)


@router.delete('/{camera_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail='Камера не найдена')
    await db.delete(camera)
    await db.commit()


@router.post('/{camera_id}/start', status_code=status.HTTP_200_OK)
async def start_camera(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail='Камера не найдена')
    camera.is_running = True
    await db.commit()
    # TODO: запустить Celery воркер для RTSP потока
    return {'status': 'started', 'camera_id': str(camera_id)}


@router.post('/{camera_id}/stop', status_code=status.HTTP_200_OK)
async def stop_camera(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail='Камера не найдена')
    camera.is_running = False
    await db.commit()
    # TODO: остановить Celery воркер
    return {'status': 'stopped', 'camera_id': str(camera_id)}
