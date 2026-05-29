"""create_doctor_schedules_table

Revision ID: f7g8h9i0j1k2
Revises: 291b0277ba62
Create Date: 2026-04-28 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f7g8h9i0j1k2'
down_revision: Union[str, Sequence[str], None] = '291b0277ba62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('doctor_schedules',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('doctor_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('day_of_week', sa.String(), nullable=False),
    sa.Column('start_time', sa.String(), nullable=False),
    sa.Column('end_time', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_doctor_schedules_doctor_id'), 'doctor_schedules', ['doctor_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_doctor_schedules_doctor_id'), table_name='doctor_schedules')
    op.drop_table('doctor_schedules')
