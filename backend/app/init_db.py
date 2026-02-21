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
    Customer, Employee, Product, Order, OrderItem, AuditLog, ReturnRequest, ReturnItem,
    Cart, CartItem, OrderStatusHistory, Notification, InventoryTransaction,
    InventoryLog, ActivityLog
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


def seed_default_admin():
    """Seed a default admin employee if no employees exist.

    This ensures there is always at least one account to log in with
    after a fresh database initialisation. The password must be changed
    after the first login via the Admin dashboard.
    """
    from app.database import SessionLocal
    from app.models.employee import Employee, EmployeeRole
    from app.utils.security import get_password_hash

    db = SessionLocal()
    try:
        if db.query(Employee).count() == 0:
            admin = Employee(
                email="admin@japanlanka.com",
                full_name="System Admin",
                password_hash=get_password_hash("Admin@1234"),
                role=EmployeeRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("\nDefault admin seeded:")
            print("  Email   : admin@japanlanka.com")
            print("  Password: Admin@1234")
            print("  Role    : ADMIN")
            print("  *** Change this password after first login ***")
        else:
            print("\nEmployees already exist — skipping default admin seed.")
    finally:
        db.close()


def drop_db():
    """Drop all database tables. Use with caution!"""
    print("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped.")


if __name__ == "__main__":
    init_db()
    seed_default_admin()
