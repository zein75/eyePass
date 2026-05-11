import math
import uuid
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.person import Person
from app.models.face_embedding import FaceEmbedding
from app.schemas.person import PersonCreate, PersonUpdate, PersonOut, PageOut

router = APIRouter(prefix='/persons', tags=['persons'])


def _to_out(p: Person) -> PersonOut:
    return PersonOut(
        id=p.id,
        full_name=p.full_name,
        phone=p.phone,
        email=p.email,
        photo_url=p.photo_url,
        is_active=p.is_active,
        created_at=p.created_at,
        has_face=bool(p.face_embeddings),
    )


@router.get('', response_model=PageOut)
async def list_persons(
    page: int = 1,
    page_size: int = 20,
    search: str = '',
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Person)
    if search:
        q = q.where(Person.full_name.ilike(f'%{search}%'))

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    results = await db.execute(
        q.offset((page - 1) * page_size).limit(page_size).order_by(Person.created_at.desc())
    )
    persons = results.scalars().unique().all()

    for p in persons:
        await db.refresh(p, ['face_embeddings'])

    return PageOut(
        items=[_to_out(p) for p in persons],
        total=total or 0,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil((total or 0) / page_size)),
    )


@router.post('', response_model=PersonOut, status_code=status.HTTP_201_CREATED)
async def create_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    person = Person(**data.model_dump())
    db.add(person)
    await db.commit()
    await db.refresh(person)
    return _to_out(person)


@router.get('/{person_id}', response_model=PersonOut)
async def get_person(
    person_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail='РџРѕСЃРµС‚РёС‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ')
    await db.refresh(person, ['face_embeddings'])
    return _to_out(person)


@router.put('/{person_id}', response_model=PersonOut)
async def update_person(
    person_id: uuid.UUID,
    data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail='РџРѕСЃРµС‚РёС‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ')

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(person, field, value)

    await db.commit()
    await db.refresh(person, ['face_embeddings'])
    return _to_out(person)


@router.delete('/{person_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    person_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail='РџРѕСЃРµС‚РёС‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ')
    await db.delete(person)
    await db.commit()


@router.post('/{person_id}/faces', status_code=status.HTTP_201_CREATED)
async def upload_faces(
    person_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Р—Р°РіСЂСѓР·РёС‚СЊ С„РѕС‚Рѕ в†’ face_service РёР·РІР»РµС‡С‘С‚ embedding в†’ СЃРѕС…СЂР°РЅРёС‚СЊ РІ Р‘Р”."""
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail='РџРѕСЃРµС‚РёС‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ')

    raw: list[tuple[str, bytes, str]] = []
    for f in files:
        content = await f.read()
        raw.append((f.filename or 'photo.jpg', content, f.content_type or 'image/jpeg'))

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f'{settings.face_service_url}/enroll',
                files=[('files', (name, data, ct)) for name, data, ct in raw],
            )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail='Face service РЅРµРґРѕСЃС‚СѓРїРµРЅ')

    if resp.status_code == 422:
        raise HTTPException(status_code=422, detail=resp.json().get('detail', 'Р›РёС†Рѕ РЅРµ РѕР±РЅР°СЂСѓР¶РµРЅРѕ'))
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail='РћС€РёР±РєР° face service')

    embeddings: list[list[float]] = resp.json()['embeddings']

    old = await db.execute(select(FaceEmbedding).where(FaceEmbedding.person_id == person_id))
    for emb in old.scalars().all():
        await db.delete(emb)

    for emb_vector in embeddings:
        db.add(FaceEmbedding(person_id=person_id, embedding=emb_vector))

    photo_dir = Path(settings.snapshot_dir) / str(person_id)
    photo_dir.mkdir(parents=True, exist_ok=True)
    (photo_dir / 'photo.jpg').write_bytes(raw[0][1])
    person.photo_url = f'/snapshots/{person_id}/photo.jpg'

    await db.commit()
    return {'uploaded': len(embeddings), 'person_id': str(person_id)}


@router.delete('/{person_id}/faces', status_code=status.HTTP_204_NO_CONTENT)
async def delete_faces(
    person_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(FaceEmbedding).where(FaceEmbedding.person_id == person_id)
    )
    for emb in result.scalars().all():
        await db.delete(emb)
    await db.commit()
