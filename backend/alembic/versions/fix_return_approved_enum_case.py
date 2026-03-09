"""fix return_approved enum case - add RETURN_APPROVED uppercase to match SQLAlchemy

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-03-09

Problem: The previous migration added 'return_approved' (lowercase) to the order_status
enum, but SQLAlchemy sends 'RETURN_APPROVED' (uppercase) because the OrderStatus enum
class does not set values_callable. All other enum values in the DB are uppercase
(PENDING, CONFIRMED, etc.) so this value must also be uppercase.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the uppercase version that SQLAlchemy actually sends
    op.execute(sa.text("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'RETURN_APPROVED'"))


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; no-op on downgrade
    pass
