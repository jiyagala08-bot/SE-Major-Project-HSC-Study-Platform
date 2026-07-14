"""add completed field to task and assessment

Revision ID: 347342255ec1
Revises: 210a38aac637
Create Date: 2026-07-14 22:14:54.381340

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '347342255ec1'
down_revision = '210a38aac637'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('assessment', schema=None) as batch_op:
        batch_op.add_column(sa.Column('completed', sa.Boolean(), nullable=False, server_default=sa.false()))

    with op.batch_alter_table('task', schema=None) as batch_op:
        batch_op.add_column(sa.Column('completed', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    with op.batch_alter_table('task', schema=None) as batch_op:
        batch_op.drop_column('completed')

    with op.batch_alter_table('assessment', schema=None) as batch_op:
        batch_op.drop_column('completed')