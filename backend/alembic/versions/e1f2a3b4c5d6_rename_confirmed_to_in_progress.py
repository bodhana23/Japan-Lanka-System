"""rename confirmed to in_progress in order_status enum

Revision ID: e1f2a3b4c5d6
Revises: d4e5f6a7b8c9
Create Date: 2026-04-15

"""
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'e1f2a3b4c5d6'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL.
    # We use a raw autocommit connection for that step, then a regular connection
    # for the UPDATE statements.
    bind = op.get_bind()

    # Step 1: Add new enum values using autocommit (required by PostgreSQL).
    with bind.engine.connect().execution_options(isolation_level="AUTOCOMMIT") as autoconn:
        autoconn.execute(text(
            "ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_progress'"
        ))
        # Also add lowercase variants for the other uppercase values we need to normalise.
        for val in ('pending', 'shipped', 'ready_to_pickup', 'delivered',
                    'picked_up', 'cancelled', 'return_approved'):
            autoconn.execute(text(
                f"ALTER TYPE order_status ADD VALUE IF NOT EXISTS '{val}'"
            ))

    # Step 2: Migrate data using the regular transactional connection.
    # Map CONFIRMED (and confirmed) → in_progress
    bind.execute(text(
        "UPDATE orders SET status = 'in_progress'::text::order_status "
        "WHERE status::text IN ('CONFIRMED', 'confirmed')"
    ))

    # Normalise other uppercase values to lowercase
    for old, new in [
        ('PENDING', 'pending'),
        ('SHIPPED', 'shipped'),
        ('READY_TO_PICKUP', 'ready_to_pickup'),
        ('DELIVERED', 'delivered'),
        ('PICKED_UP', 'picked_up'),
        ('CANCELLED', 'cancelled'),
        ('RETURN_APPROVED', 'return_approved'),
    ]:
        bind.execute(text(
            f"UPDATE orders SET status = '{new}'::text::order_status "
            f"WHERE status::text = '{old}'"
        ))

    # Note: old uppercase enum values remain in the enum type but are unused.


def downgrade():
    bind = op.get_bind()
    # Revert in_progress rows back to CONFIRMED (uppercase, original DB case)
    bind.execute(text(
        "UPDATE orders SET status = 'CONFIRMED'::text::order_status "
        "WHERE status::text = 'in_progress'"
    ))
