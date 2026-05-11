import asyncio
import uuid

import cv2
import redis as redis_lib
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraOut
from app.workers.camera_worker import process_camera_stream

router = APIRouter(prefix='/cameras', tags=['cameras'])

_redis = redis_lib.from_url(settings.redis_url, decode_responses=True)


def _to_out(c: Camera) -> CameraOut:
    return CameraOut(
        id=c.id,
        name=c.name,
        rtsp_url=c.rtsp_url,
        zone_id=c.zone_id,
        zone_name=c.zone.name if c.zone else '',
        is_active=c.is_active,
        is_running=c.is_running,
        error=_redis.get(f'camera:{c.id}:error'),
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
    if not camera.zone_id:
        raise HTTPException(status_code=400, detail='Камера не привязана к зоне')
    if camera.is_running:
        return {'status': 'already_running', 'camera_id': str(camera_id)}

    _redis.delete(f'camera:{camera_id}:stop')
    task = process_camera_stream.delay(str(camera_id))
    _redis.set(f'camera:{camera_id}:task_id', task.id, ex=86400)

    camera.is_running = True
    await db.commit()
    return {'status': 'started', 'camera_id': str(camera_id), 'task_id': task.id}


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

    _redis.set(f'camera:{camera_id}:stop', '1', ex=60)

    camera.is_running = False
    await db.commit()
    return {'status': 'stopped', 'camera_id': str(camera_id)}


async def _mjpeg_frames(rtsp_url: str):
    """Async MJPEG frame generator для StreamingResponse."""
    loop = asyncio.get_event_loop()
    cap = await loop.run_in_executor(None, cv2.VideoCapture, rtsp_url)
    try:
        while True:
            ret, frame = await loop.run_in_executor(None, cap.read)
            if not ret:
                await asyncio.sleep(1)
                continue
            ok, jpeg = await loop.run_in_executor(
                None, lambda: cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            )
            if not ok:
                continue
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n'
                + jpeg.tobytes()
                + b'\r\n'
            )
            await asyncio.sleep(0.1)
    finally:
        await loop.run_in_executor(None, cap.release)


@router.get('/{camera_id}/stream')
async def stream_camera(camera_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """MJPEG live stream. Не требует авторизации — используется как src в <img>."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail='Камера не найдена')

    return StreamingResponse(
        _mjpeg_frames(camera.rtsp_url),
        media_type='multipart/x-mixed-replace; boundary=frame',
    )


@router.get('/{camera_id}/snapshot')
async def snapshot_camera(camera_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Один JPEG-кадр с камеры. Для превью."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail='Камера не найдена')

    loop = asyncio.get_event_loop()
    cap = await loop.run_in_executor(None, cv2.VideoCapture, camera.rtsp_url)
    try:
        ret, frame = await loop.run_in_executor(None, cap.read)
        if not ret:
            raise HTTPException(status_code=503, detail='Не удалось получить кадр')
        ok, jpeg = await loop.run_in_executor(
            None, lambda: cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        )
        if not ok:
            raise HTTPException(status_code=503, detail='Ошибка кодирования кадра')
        return StreamingResponse(iter([jpeg.tobytes()]), media_type='image/jpeg')
    finally:
        await loop.run_in_executor(None, cap.release)

