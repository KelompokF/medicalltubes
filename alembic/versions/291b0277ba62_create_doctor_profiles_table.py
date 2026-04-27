"""create_doctor_profiles_table

Revision ID: 291b0277ba62
Revises: 79b85acf6112
Create Date: 2026-04-27 18:17:34.299568

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '291b0277ba62'
down_revision: Union[str, Sequence[str], None] = '79b85acf6112'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('doctor_profiles',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('specialization', sa.String(), nullable=False),
    sa.Column('hospital_name', sa.String(), nullable=False),
    sa.Column('hospital_address', sa.String(), nullable=True),
    sa.Column('about', sa.Text(), nullable=True),
    sa.Column('experience_years', sa.Integer(), nullable=True),
    sa.Column('fee', sa.Integer(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('lat', sa.Float(), nullable=True),
    sa.Column('lng', sa.Float(), nullable=True),
    sa.Column('is_available', sa.Boolean(), nullable=True),
    sa.Column('rating', sa.Float(), nullable=True),
    sa.Column('total_reviews', sa.Integer(), nullable=True),
    sa.Column('total_patients', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_doctor_profiles_user_id'), 'doctor_profiles', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_doctor_profiles_user_id'), table_name='doctor_profiles')
    op.drop_table('doctor_profiles')
