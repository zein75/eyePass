from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse, UserOut

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login', response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == form.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Неверное имя пользователя или пароль',
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Пользователь неактивен')

    token = create_access_token(subject=user.username)
    return TokenResponse(access_token=token)


@router.get('/me', response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut(id=str(user.id), username=user.username, role=user.role)
