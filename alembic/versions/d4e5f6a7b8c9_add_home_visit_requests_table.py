"""add home visit requests table

Revision ID: d4e5f6a7b8c9
Revises: c3d9f6a7b8
Create Date: 2026-04-22 16:50:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c3d9f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Buat tabel home_visit_requests."""
    op.create_table(
        'home_visit_requests',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column(
            'user_id',
            sa.String(36),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('patient_name', sa.String(), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=False),
        sa.Column('complaint', sa.Text(), nullable=False),
        sa.Column('preferred_date', sa.DateTime(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('pending', 'approved', 'rejected', 'completed', name='homevisitstatus'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    # Index untuk mempercepat query berdasarkan user_id
    op.create_index(
        'ix_home_visit_requests_user_id',
        'home_visit_requests',
        ['user_id'],
    )


def downgrade() -> None:
    """Hapus tabel home_visit_requests."""
    op.drop_index('ix_home_visit_requests_user_id', table_name='home_visit_requests')
    op.drop_table('home_visit_requests')
    # Hapus enum type (untuk PostgreSQL)
    op.execute("DROP TYPE IF EXISTS homevisitStatus")
