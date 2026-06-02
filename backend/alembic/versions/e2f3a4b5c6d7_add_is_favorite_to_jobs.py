"""add is_favorite column to jobs table

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-06-01 19:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "e2f3a4b5c6d7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "is_favorite",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("jobs", "is_favorite")
