"""add offline return fields to return_requests

Revision ID: e8f9a0b1c2d3
Revises: d5e6f7a8b9c0
Create Date: 2026-03-13

Make customer_id nullable in return_requests to support offline order returns
(where no customer account exists). Add processed_by_employee_id FK so the
manager who processed the return is tracked.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f9a0b1c2d3'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make customer_id nullable to support offline order returns
    op.execute(sa.text(
        "ALTER TABLE return_requests ALTER COLUMN customer_id DROP NOT NULL"
    ))

    # Add processed_by_employee_id FK column for manager-initiated returns
    op.execute(sa.text("""
        ALTER TABLE return_requests
        ADD COLUMN IF NOT EXISTS processed_by_employee_id UUID
        REFERENCES employees(id) ON DELETE SET NULL
    """))

    # Index for efficient queries by employee
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_return_requests_processed_by_employee_id "
        "ON return_requests(processed_by_employee_id)"
    ))


def downgrade() -> None:
    op.execute(sa.text(
        "DROP INDEX IF EXISTS ix_return_requests_processed_by_employee_id"
    ))
    op.execute(sa.text(
        "ALTER TABLE return_requests DROP COLUMN IF EXISTS processed_by_employee_id"
    ))
    # NOTE: Cannot safely revert customer_id to NOT NULL if offline returns exist.
    # Downgrade leaves customer_id nullable.
