"""add_sales_channel_to_orders

Revision ID: f1a7baf8f1fd
Revises:
Create Date: 2026-02-04 16:37:18.040115

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f1a7baf8f1fd'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add sales_channel enum, column, and offline customer fields to orders table."""

    # Note: The enum type may already exist if SQLAlchemy auto-created it from model imports.
    # We use IF NOT EXISTS pattern via DO block for safety.
    # The enum values must be UPPERCASE to match SQLAlchemy's behavior with Python enums
    # (it uses the enum NAME not the value)
    op.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sales_channel') THEN
                CREATE TYPE sales_channel AS ENUM ('ONLINE', 'OFFLINE');
            END IF;
        END $$
    """))

    # Add sales_channel column with default 'ONLINE' (uppercase to match enum)
    op.execute(sa.text("""
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS sales_channel sales_channel NOT NULL DEFAULT 'ONLINE'
    """))

    # Make customer_id nullable for offline sales
    op.execute(sa.text("ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL"))

    # Add offline customer info columns
    op.execute(sa.text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS offline_customer_name VARCHAR(200)"))
    op.execute(sa.text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS offline_customer_phone VARCHAR(20)"))

    # Create index on sales_channel for efficient filtering
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_orders_sales_channel ON orders(sales_channel)"))


def downgrade() -> None:
    """Remove sales_channel column, offline customer fields, and enum from orders table."""

    # Drop the index
    op.execute(sa.text("DROP INDEX IF EXISTS ix_orders_sales_channel"))

    # Drop the added columns
    op.execute(sa.text("ALTER TABLE orders DROP COLUMN IF EXISTS offline_customer_phone"))
    op.execute(sa.text("ALTER TABLE orders DROP COLUMN IF EXISTS offline_customer_name"))
    op.execute(sa.text("ALTER TABLE orders DROP COLUMN IF EXISTS sales_channel"))

    # Drop the enum type
    op.execute(sa.text("DROP TYPE IF EXISTS sales_channel"))

    # Note: We cannot easily revert customer_id back to NOT NULL if there are
    # existing rows with NULL values. Leaving it nullable is safer for downgrade.
