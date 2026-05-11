from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.v1.router import router as api_router
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
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

try:
    app.mount('/snapshots', StaticFiles(directory='/data/snapshots'), name='snapshots')
except RuntimeError:
    pass


@app.get('/health')
async def health():
    return {'status': 'ok'}

