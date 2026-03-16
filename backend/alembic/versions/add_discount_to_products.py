"""add discount_percentage to products

Revision ID: a1b2c3d4e5f6
Revises: f0a1b2c3d4e5
Create Date: 2026-03-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f0a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'products',
        sa.Column('discount_percentage', sa.Numeric(5, 2), nullable=True)
    )
    op.create_check_constraint(
        'ck_products_discount_percentage',
        'products',
        'discount_percentage >= 0 AND discount_percentage <= 100'
    )


def downgrade() -> None:
    op.drop_constraint('ck_products_discount_percentage', 'products', type_='check')
    op.drop_column('products', 'discount_percentage')
