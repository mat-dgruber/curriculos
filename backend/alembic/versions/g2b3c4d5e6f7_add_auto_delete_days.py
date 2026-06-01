"""add auto_delete_days to candidate_profiles

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-06-02 11:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "g2b3c4d5e6f7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "candidate_profiles",
        sa.Column("auto_delete_days", sa.Integer(), nullable=False, server_default=sa.text("30")),
    )


def downgrade() -> None:
    op.drop_column("candidate_profiles", "auto_delete_days")
