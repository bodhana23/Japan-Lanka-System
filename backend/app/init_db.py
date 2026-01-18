"""
Database initialization script.
Run this script to create all tables in the database.

Usage:
    cd backend
    source venv/bin/activate
    python -m app.init_db
"""

from app.database import engine, Base

# Import all models to register them with Base
from app.models import (
    User, Product, Order, OrderItem, AuditLog, ReturnRequest,
    Cart, CartItem, OrderStatusHistory, Notification, InventoryTransaction
)


def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

    # Print created tables
    print("\nCreated tables:")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")


def drop_db():
    """Drop all database tables. Use with caution!"""
    print("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped.")


if __name__ == "__main__":
    init_db()
