"""create_ambulance_services_table

Revision ID: 79b85acf6112
Revises: c3d9f6a7b8
Create Date: 2026-04-24 10:52:22.979258

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '79b85acf6112'
down_revision: Union[str, Sequence[str], None] = 'c3d9f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create ambulance_services table only."""
    op.create_table('ambulance_services',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('area', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('vehicle_plate', sa.String(), nullable=True),
        sa.Column('vehicle_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Drop ambulance_services table."""
    op.drop_table('ambulance_services')
