"""add system_settings table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'system_settings',
        sa.Column('key', sa.String(100), primary_key=True),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'updated_by_employee_id',
            UUID(as_uuid=True),
            sa.ForeignKey('employees.id', ondelete='SET NULL'),
            nullable=True
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP')
        ),
    )

    # Seed the 6 delivery fee tiers (matching current hardcoded values in schemas/order.py)
    op.execute("""
        INSERT INTO system_settings (key, value, description, updated_at) VALUES
        ('delivery_fee_tier1', '600',  'Tier 1: Matara (origin/dispatch point)', NOW()),
        ('delivery_fee_tier2', '1400', 'Tier 2: Galle, Hambantota', NOW()),
        ('delivery_fee_tier3', '2400', 'Tier 3: Ratnapura, Kalutara, Nuwara Eliya, Monaragala', NOW()),
        ('delivery_fee_tier4', '3200', 'Tier 4: Colombo, Gampaha, Kegalle, Badulla, Kandy', NOW()),
        ('delivery_fee_tier5', '4000', 'Tier 5: Kurunegala, Matale, Polonnaruwa, Anuradhapura, Ampara, Batticaloa, Trincomalee', NOW()),
        ('delivery_fee_tier6', '4800', 'Tier 6: Puttalam, Vavuniya, Mannar, Mullaitivu, Kilinochchi, Jaffna', NOW())
    """)


def downgrade() -> None:
    op.drop_table('system_settings')
