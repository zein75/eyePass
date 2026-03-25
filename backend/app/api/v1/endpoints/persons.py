import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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

    # Подгрузить наличие биометрии
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
        raise HTTPException(status_code=404, detail='Посетитель не найден')
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
        raise HTTPException(status_code=404, detail='Посетитель не найден')

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
        raise HTTPException(status_code=404, detail='Посетитель не найден')
    await db.delete(person)
    await db.commit()


@router.post('/{person_id}/faces', status_code=status.HTTP_201_CREATED)
async def upload_faces(
    person_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Загрузить фото для регистрации лица (реальный embedding добавит face_service)."""
    result = await db.execute(select(Person).where(Person.id == person_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail='Посетитель не найден')

    # TODO: отправить файлы в face_service для создания embedding
    # Пока возвращаем заглушку
    return {'uploaded': len(files), 'person_id': str(person_id)}


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
