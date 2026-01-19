"""
Migration script to migrate data from the old 'users' table to the new
'customers' and 'employees' tables, and rename FK columns.

This script:
1. Migrates customer users (role='customer') to the customers table
2. Migrates employee users (role in 'manager', 'admin', 'auditor') to the employees table
3. Renames foreign key columns in dependent tables
4. Handles polymorphic tables (notifications, audit_logs)

Usage:
    python -m app.migrate_users

Note: Run this BEFORE starting the server after the model changes.
"""

import sys

from sqlalchemy import text

from app.database import engine, SessionLocal


def migrate_users():
    """Main migration function."""
    db = SessionLocal()

    try:
        print("Starting user migration...")
        print("="*60)

        # Check if users table exists
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'users'
            );
        """))
        users_table_exists = result.scalar()

        if not users_table_exists:
            print("Users table does not exist. Skipping user migration.")
        else:
            # Check if customers table already has data
            result = db.execute(text("SELECT COUNT(*) FROM customers"))
            customer_count = result.scalar()

            result = db.execute(text("SELECT COUNT(*) FROM employees"))
            employee_count = result.scalar()

            if customer_count == 0 and employee_count == 0:
                # Step 1: Migrate customers (role = 'CUSTOMER')
                print("\n1. Migrating customers from users table...")
                db.execute(text("""
                    INSERT INTO customers (id, email, full_name, phone_number, address, password_hash, firebase_uid, is_active, created_at, updated_at)
                    SELECT id, email, full_name, phone_number, NULL, password_hash, firebase_uid, is_active, created_at, updated_at
                    FROM users
                    WHERE role::text = 'CUSTOMER'
                    ON CONFLICT (id) DO NOTHING;
                """))

                result = db.execute(text("SELECT COUNT(*) FROM customers"))
                print(f"   Migrated {result.scalar()} customers")

                # Step 2: Migrate employees (role in 'MANAGER', 'ADMIN', 'AUDITOR')
                print("\n2. Migrating employees from users table...")
                db.execute(text("""
                    INSERT INTO employees (id, email, full_name, password_hash, role, is_active, created_at, updated_at)
                    SELECT id, email, full_name, password_hash, role::text::employee_role, is_active, created_at, updated_at
                    FROM users
                    WHERE role::text IN ('MANAGER', 'ADMIN', 'AUDITOR')
                    ON CONFLICT (id) DO NOTHING;
                """))

                result = db.execute(text("SELECT COUNT(*) FROM employees"))
                print(f"   Migrated {result.scalar()} employees")
            else:
                print(f"\nCustomers ({customer_count}) and Employees ({employee_count}) already exist. Skipping user migration.")

        # Step 3: Rename columns in orders table
        print("\n3. Updating orders table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'orders' AND column_name = 'user_id'
            );
        """))
        if result.scalar():
            db.execute(text("ALTER TABLE orders RENAME COLUMN user_id TO customer_id;"))
            print("   Renamed user_id -> customer_id")
        else:
            print("   Already has customer_id column")

        # Step 4: Rename columns in carts table
        print("\n4. Updating carts table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'carts' AND column_name = 'user_id'
            );
        """))
        if result.scalar():
            db.execute(text("ALTER TABLE carts RENAME COLUMN user_id TO customer_id;"))
            print("   Renamed user_id -> customer_id")
        else:
            print("   Already has customer_id column")

        # Step 5: Rename columns in return_requests table
        print("\n5. Updating return_requests table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'return_requests' AND column_name = 'user_id'
            );
        """))
        if result.scalar():
            db.execute(text("ALTER TABLE return_requests RENAME COLUMN user_id TO customer_id;"))
            print("   Renamed user_id -> customer_id")
        else:
            print("   Already has customer_id column")

        # Step 6: Rename columns in order_status_history table
        print("\n6. Updating order_status_history table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'order_status_history' AND column_name = 'changed_by_user_id'
            );
        """))
        if result.scalar():
            db.execute(text("ALTER TABLE order_status_history RENAME COLUMN changed_by_user_id TO changed_by_employee_id;"))
            print("   Renamed changed_by_user_id -> changed_by_employee_id")
        else:
            print("   Already has changed_by_employee_id column")

        # Step 7: Rename columns in inventory_transactions table
        print("\n7. Updating inventory_transactions table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'inventory_transactions' AND column_name = 'user_id'
            );
        """))
        if result.scalar():
            db.execute(text("ALTER TABLE inventory_transactions RENAME COLUMN user_id TO employee_id;"))
            print("   Renamed user_id -> employee_id")
        else:
            print("   Already has employee_id column")

        # Step 8: Update notifications table (polymorphic - needs two columns)
        print("\n8. Updating notifications table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'notifications' AND column_name = 'user_id'
            );
        """))
        if result.scalar():
            # First rename user_id to customer_id
            db.execute(text("ALTER TABLE notifications RENAME COLUMN user_id TO customer_id;"))
            print("   Renamed user_id -> customer_id")

            # Add employee_id column
            db.execute(text("""
                ALTER TABLE notifications
                ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;
            """))
            print("   Added employee_id column")

            # Update: move employee notifications to employee_id column
            db.execute(text("""
                UPDATE notifications n
                SET employee_id = n.customer_id, customer_id = NULL
                WHERE EXISTS (SELECT 1 FROM employees e WHERE e.id = n.customer_id);
            """))
            print("   Moved employee notifications to employee_id")
        else:
            # Check if employee_id exists
            result = db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name = 'notifications' AND column_name = 'employee_id'
                );
            """))
            if result.scalar():
                print("   Already has customer_id and employee_id columns")
            else:
                # Has customer_id but not employee_id
                db.execute(text("""
                    ALTER TABLE notifications
                    ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;
                """))
                print("   Added employee_id column")

        # Step 9: Update audit_logs table (polymorphic - needs two columns)
        print("\n9. Updating audit_logs table...")
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'audit_logs' AND column_name = 'user_id'
            );
        """))
        if result.scalar():
            # First rename user_id to customer_id
            db.execute(text("ALTER TABLE audit_logs RENAME COLUMN user_id TO customer_id;"))
            print("   Renamed user_id -> customer_id")

            # Add employee_id column
            db.execute(text("""
                ALTER TABLE audit_logs
                ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
            """))
            print("   Added employee_id column")

            # Update: move employee audit logs to employee_id column
            db.execute(text("""
                UPDATE audit_logs al
                SET employee_id = al.customer_id, customer_id = NULL
                WHERE EXISTS (SELECT 1 FROM employees e WHERE e.id = al.customer_id);
            """))
            print("   Moved employee audit logs to employee_id")
        else:
            # Check if employee_id exists
            result = db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name = 'audit_logs' AND column_name = 'employee_id'
                );
            """))
            if result.scalar():
                print("   Already has customer_id and employee_id columns")
            else:
                # Has customer_id but not employee_id
                db.execute(text("""
                    ALTER TABLE audit_logs
                    ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
                """))
                print("   Added employee_id column")

        # Commit the transaction
        db.commit()

        print("\n" + "="*60)
        print("Migration completed successfully!")
        print("="*60)

        # Print summary
        result = db.execute(text("SELECT COUNT(*) FROM customers"))
        print(f"\nCustomers: {result.scalar()}")

        result = db.execute(text("SELECT COUNT(*) FROM employees"))
        print(f"Employees: {result.scalar()}")

        # List employees by role
        result = db.execute(text("""
            SELECT role, COUNT(*) as count
            FROM employees
            GROUP BY role
            ORDER BY role;
        """))
        print("\nEmployees by role:")
        for row in result:
            print(f"  - {row[0]}: {row[1]}")

        print("\n" + "-"*60)
        print("You can now start the server with:")
        print("  uvicorn app.main:app --reload")
        print("-"*60)

    except Exception as e:
        db.rollback()
        print(f"\nError during migration: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def verify_schema():
    """Verify the schema has been updated correctly."""
    db = SessionLocal()

    try:
        print("\nVerifying schema...")
        print("="*60)

        tables = {
            'orders': ['customer_id'],
            'carts': ['customer_id'],
            'return_requests': ['customer_id'],
            'order_status_history': ['changed_by_employee_id'],
            'inventory_transactions': ['employee_id'],
            'notifications': ['customer_id', 'employee_id'],
            'audit_logs': ['customer_id', 'employee_id'],
        }

        all_good = True
        for table, expected_cols in tables.items():
            result = db.execute(text(f"""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = '{table}'
            """))
            actual_cols = [row[0] for row in result]

            missing = [col for col in expected_cols if col not in actual_cols]
            if missing:
                print(f"❌ {table}: Missing columns: {missing}")
                all_good = False
            else:
                print(f"✓ {table}: OK ({', '.join(expected_cols)})")

        if all_good:
            print("\n✓ All schema changes applied successfully!")
        else:
            print("\n❌ Some schema changes are missing. Run the migration again.")

    finally:
        db.close()


def verify_test_accounts():
    """Verify that test accounts exist."""
    db = SessionLocal()

    try:
        print("\nVerifying test accounts...")
        print("="*60)

        # Test customers
        result = db.execute(text("""
            SELECT email, full_name, is_active
            FROM customers
            ORDER BY email
            LIMIT 10;
        """))
        print("\nCustomers:")
        for row in result:
            status = "active" if row[2] else "inactive"
            print(f"  - {row[0]} ({row[1]}) - {status}")

        # Test employees
        result = db.execute(text("""
            SELECT email, full_name, role, is_active
            FROM employees
            ORDER BY role, email;
        """))
        print("\nEmployees:")
        for row in result:
            status = "active" if row[3] else "inactive"
            print(f"  - {row[0]} ({row[1]}) - {row[2]} - {status}")

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--verify":
            verify_schema()
            verify_test_accounts()
        elif sys.argv[1] == "--schema":
            verify_schema()
        elif sys.argv[1] == "--accounts":
            verify_test_accounts()
        else:
            print(f"Unknown option: {sys.argv[1]}")
            print("Usage: python -m app.migrate_users [--verify|--schema|--accounts]")
    else:
        migrate_users()
        verify_schema()
        verify_test_accounts()
