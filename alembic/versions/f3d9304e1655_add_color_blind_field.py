"""add_color_blind_field

Revision ID: f3d9304e1655
Revises: b3fddbb5e1cc
Create Date: 2026-04-29 15:30:46.897885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
"""add_color_blind_field

Revision ID: f3d9304e1655
Revises: b3fddbb5e1cc
Create Date: 2026-04-29 15:30:46.897885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f3d9304e1655'
down_revision: Union[str, Sequence[str], None] = 'b3fddbb5e1cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('color_blind_enabled', sa.Boolean(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'color_blind_enabled')
