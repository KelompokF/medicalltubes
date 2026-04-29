"""Add contrast_mode column

Revision ID: 88e63afcc338
Revises: 530a8b413cf1
Create Date: 2026-04-29 19:14:13.924268

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88e63afcc338'
down_revision: Union[str, Sequence[str], None] = '530a8b413cf1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('contrast_mode', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'contrast_mode')
