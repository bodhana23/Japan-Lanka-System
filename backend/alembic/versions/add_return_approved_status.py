"""add return_approved to order_status enum

Revision ID: b3c4d5e6f7a8
Revises: add_payment_fields
Create Date: 2026-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'add_payment_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL requires a specific syntax to add a value to an existing enum type
    op.execute(sa.text("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_approved'"))


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # To downgrade, you would need to recreate the enum without 'return_approved'.
    # This is a no-op since removing enum values is destructive and not easily reversible.
    pass
