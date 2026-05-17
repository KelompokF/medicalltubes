"""add ambulance tracking tables and columns

Revision ID: c919e33a9eb7
Revises: a1b2c3d4e5f7
Create Date: 2026-05-17 18:30:39.383465

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c919e33a9eb7'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f7', '63d11e447add')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ambulance_location_updates table
    op.create_table(
        'ambulance_location_updates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('ambulance_service_id', sa.UUID(), nullable=False),
        sa.Column('emergency_request_id', sa.UUID(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('accuracy', sa.Float(), nullable=True),
        sa.Column('speed', sa.Float(), nullable=True),
        sa.Column('heading', sa.Float(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['ambulance_service_id'], ['ambulance_services.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['emergency_request_id'], ['emergency_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for ambulance_location_updates
    op.create_index('idx_emergency_request', 'ambulance_location_updates', ['emergency_request_id'])
    op.create_index('idx_ambulance_service', 'ambulance_location_updates', ['ambulance_service_id'])
    op.create_index('idx_timestamp', 'ambulance_location_updates', ['timestamp'])
    
    # Add is_sharing_location column to ambulance_services
    op.add_column('ambulance_services', sa.Column('is_sharing_location', sa.Boolean(), nullable=False, server_default='0'))
    
    # Add tracking metadata columns to emergency_requests
    op.add_column('emergency_requests', sa.Column('tracking_started_at', sa.DateTime(), nullable=True))
    op.add_column('emergency_requests', sa.Column('tracking_stopped_at', sa.DateTime(), nullable=True))
    op.add_column('emergency_requests', sa.Column('last_ambulance_location_lat', sa.Float(), nullable=True))
    op.add_column('emergency_requests', sa.Column('last_ambulance_location_lng', sa.Float(), nullable=True))
    op.add_column('emergency_requests', sa.Column('last_ambulance_location_updated_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove tracking metadata columns from emergency_requests
    op.drop_column('emergency_requests', 'last_ambulance_location_updated_at')
    op.drop_column('emergency_requests', 'last_ambulance_location_lng')
    op.drop_column('emergency_requests', 'last_ambulance_location_lat')
    op.drop_column('emergency_requests', 'tracking_stopped_at')
    op.drop_column('emergency_requests', 'tracking_started_at')
    
    # Remove is_sharing_location column from ambulance_services
    op.drop_column('ambulance_services', 'is_sharing_location')
    
    # Drop indexes for ambulance_location_updates
    op.drop_index('idx_timestamp', table_name='ambulance_location_updates')
    op.drop_index('idx_ambulance_service', table_name='ambulance_location_updates')
    op.drop_index('idx_emergency_request', table_name='ambulance_location_updates')
    
    # Drop ambulance_location_updates table
    op.drop_table('ambulance_location_updates')
