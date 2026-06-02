"""create application_clicks table

Revision ID: d1e2f3a4b5c6
Revises: 58c25df1e1ce
Create Date: 2026-06-01 18:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "d1e2f3a4b5c6"
down_revision = "58c25df1e1ce"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "application_clicks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "application_id",
            sa.String(36),
            sa.ForeignKey("applications.id"),
            nullable=False,
        ),
        sa.Column("clicked_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_application_clicks_application_id",
        "application_clicks",
        ["application_id"],
        unique=False,
    )
    op.create_index(
        "ix_application_clicks_clicked_at",
        "application_clicks",
        ["clicked_at"],
        unique=False,
    )

    # Seed: 2 clicks for app-1 (Desenvolvedor Angular Senior)
    op.execute(
        "INSERT INTO application_clicks (id, application_id, clicked_at) VALUES "
        "('click-seed-1', 'app-1', '2026-05-31T22:00:00'), "
        "('click-seed-2', 'app-1', '2026-06-01T08:00:00')"
    )


def downgrade() -> None:
    op.drop_index("ix_application_clicks_clicked_at", table_name="application_clicks")
    op.drop_index(
        "ix_application_clicks_application_id", table_name="application_clicks"
    )
    op.drop_table("application_clicks")
