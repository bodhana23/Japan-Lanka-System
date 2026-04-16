"""add advertisements table

Revision ID: c1d2e3f4a5b6
Revises: a1b2c3d4e5f6
Create Date: 2026-03-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define the enum separately so we can control creation/dropping explicitly
mediatype_enum = sa.Enum('image', 'video', name='mediatype')


def upgrade() -> None:
    # Create the enum type first (checkfirst avoids error if it already exists)
    mediatype_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'advertisements',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
        ),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('media_url', sa.String(500), nullable=False),
        sa.Column(
            'media_type',
            # create_type=False because we already created it above
            sa.Enum('image', 'video', name='mediatype', create_type=False),
            nullable=False,
        ),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP'),
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP'),
        ),
    )


def downgrade() -> None:
    op.drop_table('advertisements')
    op.execute("DROP TYPE IF EXISTS mediatype")
