"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op
from pgvector.sqlalchemy import Vector

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.execute("CREATE TYPE user_role AS ENUM ('admin', 'operator')")
    op.execute("CREATE TYPE decision_type AS ENUM ('allow', 'deny', 'unknown')")

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(64), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(128), nullable=False),
        sa.Column('role', sa.Enum('admin', 'operator', name='user_role'), default='operator'),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'zones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(128), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
    )

    op.create_table(
        'persons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(256), nullable=False),
        sa.Column('phone', sa.String(32), unique=True, nullable=True),
        sa.Column('email', sa.String(256), unique=True, nullable=True),
        sa.Column('photo_url', sa.String(512), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'face_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('person_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('persons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('embedding', Vector(512), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'cameras',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(128), nullable=False),
        sa.Column('rtsp_url', sa.String(512), nullable=False),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_running', sa.Boolean, default=False),
    )

    op.create_table(
        'access_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('person_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('persons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id', ondelete='CASCADE'), nullable=False),
        sa.Column('time_from', sa.Time, nullable=False),
        sa.Column('time_to', sa.Time, nullable=False),
        sa.Column('days_of_week', sa.ARRAY(sa.Integer), nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
    )

    op.create_table(
        'access_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('person_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('persons.id', ondelete='SET NULL'), nullable=True),
        sa.Column('camera_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cameras.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id', ondelete='CASCADE'), nullable=False),
        sa.Column('decision', sa.Enum('allow', 'deny', 'unknown', name='decision_type'), nullable=False),
        sa.Column('confidence', sa.Float, nullable=True),
        sa.Column('snapshot_url', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )


def downgrade() -> None:
    op.drop_table('access_events')
    op.drop_table('access_rules')
    op.drop_table('cameras')
    op.drop_table('face_embeddings')
    op.drop_table('persons')
    op.drop_table('zones')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS decision_type')
    op.execute('DROP TYPE IF EXISTS user_role')
