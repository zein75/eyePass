"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-25
"""
from typing import Sequence, Union
from alembic import op

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(64) NOT NULL UNIQUE,
            hashed_password VARCHAR(128) NOT NULL,
            role VARCHAR(16) NOT NULL DEFAULT 'operator',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS zones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(128) NOT NULL,
            description TEXT
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS persons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(256) NOT NULL,
            phone VARCHAR(32) UNIQUE,
            email VARCHAR(256) UNIQUE,
            photo_url VARCHAR(512),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            embedding vector(512) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS cameras (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(128) NOT NULL,
            rtsp_url VARCHAR(512) NOT NULL,
            zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            is_running BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS access_rules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
            time_from TIME NOT NULL,
            time_to TIME NOT NULL,
            days_of_week INTEGER[] NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS access_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
            zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
            decision VARCHAR(16) NOT NULL,
            confidence FLOAT,
            snapshot_url VARCHAR(512),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute('CREATE INDEX IF NOT EXISTS ix_access_events_created_at ON access_events(created_at)')


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS access_events')
    op.execute('DROP TABLE IF EXISTS access_rules')
    op.execute('DROP TABLE IF EXISTS cameras')
    op.execute('DROP TABLE IF EXISTS face_embeddings')
    op.execute('DROP TABLE IF EXISTS persons')
    op.execute('DROP TABLE IF EXISTS zones')
    op.execute('DROP TABLE IF EXISTS users')
