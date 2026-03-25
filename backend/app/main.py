from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as api_router
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создать таблицы при старте (в prod используй Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title='eyePass API',
    description='Биометрический контроль доступа для фитнес-центра',
    version='0.1.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://frontend'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router, prefix='/api/v1')

# Статические файлы (снимки событий)
try:
    app.mount('/snapshots', StaticFiles(directory='/data/snapshots'), name='snapshots')
except RuntimeError:
    pass  # директория не существует в dev окружении


@app.get('/health')
async def health():
    return {'status': 'ok'}
