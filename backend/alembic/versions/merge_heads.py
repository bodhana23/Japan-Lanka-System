"""merge heads: offline_return_fields and create_notifications_table

Revision ID: f0a1b2c3d4e5
Revises: e8f9a0b1c2d3, a2b3c4d5e6f7
Create Date: 2026-03-13

Merges the create_notifications_table branch with the main branch
that now includes offline return support.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = ('e8f9a0b1c2d3', 'a2b3c4d5e6f7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
