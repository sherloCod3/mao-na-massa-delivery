"""kanban_pedidos

Add status_anterior column to pedidos and create status_history table.

Revision ID: fc6c499ff809
Revises: fc6c499ff808
Create Date: 2026-07-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc6c499ff809'
down_revision: Union[str, Sequence[str], None] = 'fc6c499ff808'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # --- Step 1: Add status_anterior column to pedidos ---
    op.add_column(
        'pedidos',
        sa.Column('status_anterior', sa.String(length=20), nullable=True),
    )

    # --- Step 2: Create status_history table ---
    op.create_table(
        'status_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=False),
        sa.Column('status_anterior', sa.String(length=20), nullable=True),
        sa.Column('status_novo', sa.String(length=20), nullable=False),
        sa.Column('alterado_por', sa.String(length=20), nullable=False, server_default='admin'),
        sa.Column('motivo', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedidos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_status_history_pedido', 'status_history', ['pedido_id'])

    # --- Step 3: Migrate existing data ---
    # Update recebido → pendente
    op.execute(
        "UPDATE pedidos SET status = 'pendente' WHERE status = 'recebido'"
    )

    # Seed status_history for existing pedidos
    op.execute(
        "INSERT INTO status_history (pedido_id, status_anterior, status_novo, alterado_por, created_at) "
        "SELECT id, NULL, CASE WHEN status = 'recebido' THEN 'pendente' ELSE status END, 'sistema', created_at "
        "FROM pedidos"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove seeded history
    op.execute("DELETE FROM status_history")

    # Revert data: pendente → recebido
    op.execute(
        "UPDATE pedidos SET status = 'recebido' WHERE status = 'pendente'"
    )

    # Drop status_history table
    op.drop_index('idx_status_history_pedido', table_name='status_history')
    op.drop_table('status_history')

    # Remove status_anterior column
    op.drop_column('pedidos', 'status_anterior')
