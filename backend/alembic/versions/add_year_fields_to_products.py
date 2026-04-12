"""add year_from and year_to columns to products table

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-04-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use ADD COLUMN IF NOT EXISTS so this is safe to run even if columns
    # already exist (e.g. on a local DB created directly from the model).
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS year_from INTEGER")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS year_to INTEGER")


def downgrade() -> None:
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS year_from")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS year_to")
