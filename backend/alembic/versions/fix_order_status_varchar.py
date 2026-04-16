"""Convert order status columns from native enum to VARCHAR to fix case mismatch

Revision ID: a1b2c3d4e5f6
Revises: e1f2a3b4c5d6
Create Date: 2026-04-16

The order_status PostgreSQL enum type was created with uppercase labels
(PENDING, IN_PROGRESS, etc.) while Python's OrderStatus enum uses lowercase
values (pending, in_progress, etc.). This causes SQLAlchemy to fail when
reading rows that have lowercase status values stored in the DB.

Fix: Convert the status columns in orders and order_status_history to VARCHAR
so SQLAlchemy bypasses native enum validation entirely.
"""
from alembic import op
from sqlalchemy import text

revision = 'f6e5d4c3b2a1'
down_revision = 'e1f2a3b4c5d6'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # Convert orders.status from native enum to VARCHAR
    bind.execute(text(
        "ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(50) USING status::text"
    ))

    # Convert order_status_history.new_status and old_status from native enum to VARCHAR
    bind.execute(text(
        "ALTER TABLE order_status_history ALTER COLUMN new_status TYPE VARCHAR(50) USING new_status::text"
    ))
    bind.execute(text(
        "ALTER TABLE order_status_history ALTER COLUMN old_status TYPE VARCHAR(50) USING old_status::text"
    ))


def downgrade():
    # Reversing this would require recreating the enum columns — not practical.
    pass
