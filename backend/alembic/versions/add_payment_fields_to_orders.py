"""Add payment tracking fields to orders

Revision ID: add_payment_fields
Revises: f1a7baf8f1fd
Create Date: 2026-02-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_payment_fields'
down_revision: Union[str, None] = 'f1a7baf8f1fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create payment_status enum type
    payment_status_enum = sa.Enum('not_paid', 'partially_paid', 'paid', name='payment_status')
    payment_status_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to orders table
    op.add_column('orders', sa.Column('subtotal', sa.Numeric(12, 2), nullable=True))
    op.add_column('orders', sa.Column('delivery_fee', sa.Numeric(10, 2), nullable=True, server_default='0'))
    op.add_column('orders', sa.Column('paid_amount', sa.Numeric(12, 2), nullable=True, server_default='0'))
    op.add_column('orders', sa.Column('remaining_amount', sa.Numeric(12, 2), nullable=True, server_default='0'))
    op.add_column('orders', sa.Column('payment_status', payment_status_enum, nullable=False, server_default='not_paid'))
    op.add_column('orders', sa.Column('shipping_district', sa.String(100), nullable=True))
    op.add_column('orders', sa.Column('payhere_payment_id', sa.String(100), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('orders', 'payhere_payment_id')
    op.drop_column('orders', 'shipping_district')
    op.drop_column('orders', 'payment_status')
    op.drop_column('orders', 'remaining_amount')
    op.drop_column('orders', 'paid_amount')
    op.drop_column('orders', 'delivery_fee')
    op.drop_column('orders', 'subtotal')

    # Drop enum type
    sa.Enum(name='payment_status').drop(op.get_bind(), checkfirst=True)
