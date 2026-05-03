"""create_emergency_requests_table

Revision ID: 63d11e447add
Revises: d4e5f6a7b8c9, e5da87481a44
Create Date: 2026-04-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '63d11e447add'
down_revision: Union[str, Sequence[str], None] = ('d4e5f6a7b8c9', 'e5da87481a44')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('emergency_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('ambulance_service_id', sa.UUID(), nullable=True),
        sa.Column('location_lat', sa.Float(), nullable=False),
        sa.Column('location_lng', sa.Float(), nullable=False),
        sa.Column('location_address', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=False, server_default='general'),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='dispatched'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['ambulance_service_id'], ['ambulance_services.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_emergency_requests_ambulance_service_id', 'emergency_requests', ['ambulance_service_id'])
    op.create_index('ix_emergency_requests_created_at', 'emergency_requests', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_emergency_requests_created_at', table_name='emergency_requests')
    op.drop_index('ix_emergency_requests_ambulance_service_id', table_name='emergency_requests')
    op.drop_table('emergency_requests')
