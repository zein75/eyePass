import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix='/users', tags=['users'])


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    role: str
    is_active: bool

    model_config = {'from_attributes': True}


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = 'operator'


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.get('', response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.post('', response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = await db.scalar(select(User).where(User.username == data.username))
    if existing:
        raise HTTPException(status_code=409, detail='Пользователь уже существует')
    if data.role not in ('admin', 'operator'):
        raise HTTPException(status_code=422, detail='Роль: admin или operator')

    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_admin),
):
    if current.id == user_id:
        raise HTTPException(status_code=400, detail='Нельзя удалить себя')
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='Пользователь не найден')
    await db.delete(user)
    await db.commit()


@router.patch('/{user_id}/toggle', response_model=UserOut)
async def toggle_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_admin),
):
    if current.id == user_id:
        raise HTTPException(status_code=400, detail='Нельзя деактивировать себя')
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='Пользователь не найден')
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.post('/me/password', status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
):
    from app.core.security import verify_password
    if not verify_password(data.current_password, current.hashed_password):
        raise HTTPException(status_code=400, detail='Неверный текущий пароль')
    current.hashed_password = hash_password(data.new_password)
    await db.commit()
