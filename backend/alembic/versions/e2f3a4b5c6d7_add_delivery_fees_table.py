"""add delivery_fees table

Revision ID: e2f3a4b5c6d7
Revises: d4e5f6a7b8c9
Create Date: 2026-04-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'delivery_fees',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
        ),
        sa.Column('district_name', sa.String(100), nullable=False, unique=True),
        sa.Column('fee', sa.Numeric(10, 2), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP'),
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP'),
        ),
    )
    op.create_index('ix_delivery_fees_district_name', 'delivery_fees', ['district_name'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_delivery_fees_district_name', table_name='delivery_fees')
    op.drop_table('delivery_fees')
