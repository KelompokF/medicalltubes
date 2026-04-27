"""update_home_visits_table

Revision ID: e5da87481a44
Revises: 291b0277ba62
Create Date: 2026-04-27 18:37:06.650627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e5da87481a44'
down_revision: Union[str, Sequence[str], None] = '291b0277ba62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Upgrade home_visits table
    op.add_column('home_visits', sa.Column('doctor_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('home_visits', sa.Column('specialization', sa.String(), nullable=True))
    op.add_column('home_visits', sa.Column('date', sa.Date(), nullable=False, server_default='2026-01-01'))
    op.add_column('home_visits', sa.Column('time', sa.String(), nullable=False, server_default='00:00'))
    op.add_column('home_visits', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.alter_column('home_visits', 'doctor_name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.create_index(op.f('ix_home_visits_doctor_id'), 'home_visits', ['doctor_id'], unique=False)
    # The patient_id foreign key from earlier might not have a name or be named home_visits_patient_id_fkey, so we won't drop it unless necessary. We'll leave it.
    op.drop_column('home_visits', 'scheduled_time')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('home_visits', sa.Column('scheduled_time', postgresql.TIMESTAMP(), autoincrement=False, nullable=False, server_default='2026-01-01 00:00:00'))
    op.drop_index(op.f('ix_home_visits_doctor_id'), table_name='home_visits')
    op.alter_column('home_visits', 'doctor_name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_column('home_visits', 'updated_at')
    op.drop_column('home_visits', 'time')
    op.drop_column('home_visits', 'date')
    op.drop_column('home_visits', 'specialization')
    op.drop_column('home_visits', 'doctor_id')
