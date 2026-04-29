"""Merge heads

Revision ID: 66d90e7d1edf
Revises: d4e5f6a7b8c9, e5da87481a44
Create Date: 2026-04-29 14:38:43.492304

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66d90e7d1edf'
down_revision: Union[str, Sequence[str], None] = ('d4e5f6a7b8c9', 'e5da87481a44')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
