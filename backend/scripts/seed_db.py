import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings
from app.core.security import hash_password
from app.models import *
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
        from sqlalchemy import select
        existing = await db.scalar(select(User).where(User.username == 'admin'))
        if not existing:
            admin = User(
                username='admin',
                hashed_password=hash_password('admin123'),
                role='admin',
            )
            db.add(admin)
            print('вњ“ РЎРѕР·РґР°РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ admin / admin123')
        else:
            print('вЂ“ РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ admin СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚')

        zones_data = [
            ('Р РµС†РµРїС†РёСЏ',     'Р“Р»Р°РІРЅС‹Р№ РІС…РѕРґ'),
            ('РћСЃРЅРѕРІРЅРѕР№ Р·Р°Р»', 'РўСЂРµРЅР°Р¶С‘СЂРЅС‹Р№ Р·Р°Р», 1 СЌС‚Р°Р¶'),
            ('Р‘Р°СЃСЃРµР№РЅ',      'РџР»Р°РІР°С‚РµР»СЊРЅС‹Р№ РєРѕРјРїР»РµРєСЃ'),
            ('РЎР°СѓРЅР°',        'Р¤РёРЅСЃРєР°СЏ Рё С‚СѓСЂРµС†РєР°СЏ Р±Р°РЅСЏ'),
        ]
        zones = []
        for name, desc in zones_data:
            z = await db.scalar(select(Zone).where(Zone.name == name))
            if not z:
                z = Zone(name=name, description=desc)
                db.add(z)
                print(f'вњ“ Р—РѕРЅР°: {name}')
            zones.append(z)

        await db.flush()

        if zones:
            cameras_data = [
                ('Р“Р»Р°РІРЅС‹Р№ РІС…РѕРґ',  'rtsp://192.168.1.101/stream', zones[0]),
                ('Р—Р°Р» вЂ” СЃРµРІРµСЂ',   'rtsp://192.168.1.102/stream', zones[1]),
                ('Р—Р°Р» вЂ” СЋРі',      'rtsp://192.168.1.103/stream', zones[1]),
                ('Р‘Р°СЃСЃРµР№РЅ РІС…РѕРґ',  'rtsp://192.168.1.104/stream', zones[2]),
            ]
            for cam_name, rtsp, zone in cameras_data:
                c = await db.scalar(select(Camera).where(Camera.name == cam_name))
                if not c:
                    c = Camera(name=cam_name, rtsp_url=rtsp, zone_id=zone.id)
                    db.add(c)
                    print(f'вњ“ РљР°РјРµСЂР°: {cam_name}')

        persons_data = [
            ('РРІР°РЅРѕРІ РРІР°РЅ РРІР°РЅРѕРІРёС‡',    '+7 900 123-45-67', 'ivanov@mail.ru'),
            ('РџРµС‚СЂРѕРІР° РђРЅРЅР° РЎРµСЂРіРµРµРІРЅР°',  '+7 901 234-56-78', 'petrova@mail.ru'),
            ('РЎРёРґРѕСЂРѕРІ Р”РјРёС‚СЂРёР№ РћР»РµРіРѕРІРёС‡','+7 902 345-67-89', None),
        ]
        for full_name, phone, email in persons_data:
            p = await db.scalar(select(Person).where(Person.full_name == full_name))
            if not p:
                p = Person(full_name=full_name, phone=phone, email=email)
                db.add(p)
                print(f'вњ“ РџРѕСЃРµС‚РёС‚РµР»СЊ: {full_name}')

        await db.commit()
        print('\nвњ… Seed Р·Р°РІРµСЂС€С‘РЅ СѓСЃРїРµС€РЅРѕ!')
        print('   Р›РѕРіРёРЅ: admin')
        print('   РџР°СЂРѕР»СЊ: admin123')
        print('   Swagger: http://localhost:8000/docs')


if __name__ == '__main__':
    asyncio.run(seed())


