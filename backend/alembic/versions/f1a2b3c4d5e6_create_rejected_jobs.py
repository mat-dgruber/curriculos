"""create rejected_jobs table

Revision ID: f1a2b3c4d5e6
Revises: e2f3a4b5c6d7
Create Date: 2026-06-02 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "f1a2b3c4d5e6"
down_revision = "e2f3a4b5c6d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rejected_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("original_job_id", sa.String(36), nullable=True),
        sa.Column("url", sa.String(1024), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("location", sa.String(255), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("reason", sa.String(50), nullable=False, server_default=sa.text("'incompativel'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_rejected_jobs_url", "rejected_jobs", ["url"])
    op.create_index("ix_rejected_jobs_rejected_at", "rejected_jobs", ["rejected_at"])


def downgrade() -> None:
    op.drop_index("ix_rejected_jobs_rejected_at")
    op.drop_index("ix_rejected_jobs_url")
    op.drop_table("rejected_jobs")
