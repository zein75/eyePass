"""
Заполнить БД начальными данными.
Запуск:  docker-compose exec backend python scripts/seed_db.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings
from app.core.security import hash_password
from app.models import *  # noqa: F401, F403 — регистрация моделей
from app.models.user import User
from app.models.zone import Zone
from app.models.camera import Camera
from app.models.person import Person
from app.database import Base

engine = create_async_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # ── Admin user ────────────────────────────────────────────────────────
        from sqlalchemy import select
        existing = await db.scalar(select(User).where(User.username == 'admin'))
        if not existing:
            admin = User(
                username='admin',
                hashed_password=hash_password('admin123'),
                role='admin',
            )
            db.add(admin)
            print('✓ Создан пользователь admin / admin123')
        else:
            print('– Пользователь admin уже существует')

        # ── Zones ─────────────────────────────────────────────────────────────
        zones_data = [
            ('Рецепция',     'Главный вход'),
            ('Основной зал', 'Тренажёрный зал, 1 этаж'),
            ('Бассейн',      'Плавательный комплекс'),
            ('Сауна',        'Финская и турецкая баня'),
        ]
        zones = []
        for name, desc in zones_data:
            z = await db.scalar(select(Zone).where(Zone.name == name))
            if not z:
                z = Zone(name=name, description=desc)
                db.add(z)
                print(f'✓ Зона: {name}')
            zones.append(z)

        await db.flush()

        # ── Cameras ───────────────────────────────────────────────────────────
        if zones:
            cameras_data = [
                ('Главный вход',  'rtsp://192.168.1.101/stream', zones[0]),
                ('Зал — север',   'rtsp://192.168.1.102/stream', zones[1]),
                ('Зал — юг',      'rtsp://192.168.1.103/stream', zones[1]),
                ('Бассейн вход',  'rtsp://192.168.1.104/stream', zones[2]),
            ]
            for cam_name, rtsp, zone in cameras_data:
                c = await db.scalar(select(Camera).where(Camera.name == cam_name))
                if not c:
                    c = Camera(name=cam_name, rtsp_url=rtsp, zone_id=zone.id)
                    db.add(c)
                    print(f'✓ Камера: {cam_name}')

        # ── Test persons ──────────────────────────────────────────────────────
        persons_data = [
            ('Иванов Иван Иванович',    '+7 900 123-45-67', 'ivanov@mail.ru'),
            ('Петрова Анна Сергеевна',  '+7 901 234-56-78', 'petrova@mail.ru'),
            ('Сидоров Дмитрий Олегович','+7 902 345-67-89', None),
        ]
        for full_name, phone, email in persons_data:
            p = await db.scalar(select(Person).where(Person.full_name == full_name))
            if not p:
                p = Person(full_name=full_name, phone=phone, email=email)
                db.add(p)
                print(f'✓ Посетитель: {full_name}')

        await db.commit()
        print('\n✅ Seed завершён успешно!')
        print('   Логин: admin')
        print('   Пароль: admin123')
        print('   Swagger: http://localhost:8000/docs')


if __name__ == '__main__':
    asyncio.run(seed())
