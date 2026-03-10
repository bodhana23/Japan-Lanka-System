"""add picked_up to order_status enum

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-03-10

Add PICKED_UP status for pickup orders. Uppercase to match SQLAlchemy's
behaviour of sending the enum NAME (not value) to PostgreSQL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Must be uppercase to match SQLAlchemy's behaviour (sends enum NAME, not value)
    op.execute(sa.text("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PICKED_UP'"))


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; no-op on downgrade
    pass
