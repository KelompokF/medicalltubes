"""create_emergency_requests_table

Revision ID: 7c2d9a8e6f31
Revises: e5da87481a44
Create Date: 2026-04-27 21:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "7c2d9a8e6f31"
down_revision: Union[str, Sequence[str], None] = "e5da87481a44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "emergency_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("request_type", sa.String(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("ambulance_service_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ambulance_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["ambulance_service_id"], ["ambulance_services.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_emergency_requests_patient_id"), "emergency_requests", ["patient_id"], unique=False)
    op.create_index(
        op.f("ix_emergency_requests_ambulance_service_id"),
        "emergency_requests",
        ["ambulance_service_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_emergency_requests_ambulance_service_id"), table_name="emergency_requests")
    op.drop_index(op.f("ix_emergency_requests_patient_id"), table_name="emergency_requests")
    op.drop_table("emergency_requests")
