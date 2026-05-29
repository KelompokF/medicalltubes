"""add user profile fields

Revision ID: b1a2c3d4e5f6
Revises: 
Create Date: 2026-04-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b1a2c3d4e5f6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('place_of_birth', sa.String(), nullable=True))
    op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('blood_type', sa.String(), nullable=True))
    op.add_column('users', sa.Column('allergies', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'allergies')
    op.drop_column('users', 'blood_type')
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'place_of_birth')
