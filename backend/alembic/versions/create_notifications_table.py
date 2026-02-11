"""create_notifications_table

Revision ID: a2b3c4d5e6f7
Revises: f1a7baf8f1fd
Create Date: 2026-02-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'f1a7baf8f1fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notifications table with proper indexes and constraints."""

    # Create notification_type enum if it doesn't exist
    op.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
                CREATE TYPE notification_type AS ENUM ('order_update', 'return_update', 'system', 'promotion');
            END IF;
        END $$
    """))

    # Create notifications table if it doesn't exist
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
            employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type notification_type NOT NULL DEFAULT 'system',
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
            related_return_id UUID REFERENCES return_requests(id) ON DELETE SET NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),

            -- Constraint: exactly one of customer_id or employee_id must be set
            CONSTRAINT check_notification_user_type CHECK (
                (customer_id IS NOT NULL AND employee_id IS NULL) OR
                (customer_id IS NULL AND employee_id IS NOT NULL)
            )
        )
    """))

    # Create indexes for efficient querying
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_customer_id ON notifications(customer_id)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_employee_id ON notifications(employee_id)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications(created_at DESC)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_related_order_id ON notifications(related_order_id)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_related_return_id ON notifications(related_return_id)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE"))


def downgrade() -> None:
    """Drop notifications table and enum."""

    # Drop the indexes first
    op.execute(sa.text("DROP INDEX IF EXISTS ix_notifications_is_read"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_notifications_related_return_id"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_notifications_related_order_id"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_notifications_created_at"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_notifications_employee_id"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_notifications_customer_id"))

    # Drop the table
    op.execute(sa.text("DROP TABLE IF EXISTS notifications"))

    # Drop the enum type
    op.execute(sa.text("DROP TYPE IF EXISTS notification_type"))
