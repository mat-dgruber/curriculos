"""add_email_to_fixed_companies

Revision ID: 388c518b7f5a
Revises: g2b3c4d5e6f7
Create Date: 2026-07-20 16:36:00.217758

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '388c518b7f5a'
down_revision: Union[str, None] = 'g2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email column
    op.add_column('fixed_companies', sa.Column('email', sa.String(length=255), nullable=True))
    
    # Make application_url nullable
    with op.batch_alter_table('fixed_companies', schema=None) as batch_op:
        batch_op.alter_column('application_url',
               existing_type=sa.String(length=1024),
               nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('fixed_companies', schema=None) as batch_op:
        batch_op.alter_column('application_url',
               existing_type=sa.String(length=1024),
               nullable=False)
               
    op.drop_column('fixed_companies', 'email')
