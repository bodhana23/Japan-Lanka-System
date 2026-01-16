"""
Seed script to populate the database with initial data.
This includes:
- Staff accounts (manager, admin, auditor)
- Sample customer account
- Products (automobile parts for Sri Lankan market)
- Sample orders for testing

Run with: python -m app.seed_data
"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
import random

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderStatus, DeliveryMethod
from app.models.order_item import OrderItem
from app.utils.security import hash_password


def seed_users(db: Session) -> dict:
    """
    Seed staff accounts and a sample customer.
    Returns a dict mapping email to user object for reference.
    """
    users_data = [
        {
            "email": "manager1@gmail.com",
            "full_name": "Manager One",
            "phone_number": "0771234567",
            "password": "manager@1",
            "role": UserRole.MANAGER
        },
        {
            "email": "admin@gmail.com",
            "full_name": "System Admin",
            "phone_number": "0772345678",
            "password": "admin@1",
            "role": UserRole.ADMIN
        },
        {
            "email": "auditor1@gmail.com",
            "full_name": "Auditor One",
            "phone_number": "0773456789",
            "password": "auditor@1",
            "role": UserRole.AUDITOR
        },
        {
            "email": "customer2@gmail.com",
            "full_name": "Customer Two",
            "phone_number": "0774567890",
            "password": "customer@2222",
            "role": UserRole.CUSTOMER
        }
    ]

    created_users = {}

    for user_data in users_data:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f"  User {user_data['email']} already exists, skipping...")
            created_users[user_data["email"]] = existing_user
            continue

        user = User(
            email=user_data["email"],
            full_name=user_data["full_name"],
            phone_number=user_data["phone_number"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
        created_users[user_data["email"]] = user
        print(f"  Created user: {user_data['email']} ({user_data['role'].value})")

    db.commit()
    return created_users


def seed_products(db: Session) -> list:
    """
    Seed products - exact products from frontend Shop.tsx plus additional
    popular items for Sri Lankan market.
    Returns list of created/existing products.
    """
    # Products from frontend Shop.tsx
    products_data = [
        {
            "name": "Brake Pads Set",
            "description": "High-quality ceramic brake pads set (front) for Toyota Camry 2018-2023. Includes installation kit.",
            "brand": "Toyota",
            "model": "Camry",
            "year_from": 2018,
            "year_to": 2023,
            "category": "Brake System",
            "price": Decimal("8500.00"),
            "quantity_available": 25,
            "image_url": None
        },
        {
            "name": "Engine Oil Filter",
            "description": "Premium oil filter for Honda Civic 2016-2021. OEM quality replacement part.",
            "brand": "Honda",
            "model": "Civic",
            "year_from": 2016,
            "year_to": 2021,
            "category": "Engine Parts",
            "price": Decimal("1800.00"),
            "quantity_available": 40,
            "image_url": None
        },
        {
            "name": "LED Headlight Bulbs",
            "description": "High-intensity LED headlight bulb set for BMW 3 Series 2019-2024. 6000K white light.",
            "brand": "BMW",
            "model": "3 Series",
            "year_from": 2019,
            "year_to": 2024,
            "category": "Lighting",
            "price": Decimal("12500.00"),
            "quantity_available": 15,
            "image_url": None
        },
        {
            "name": "Air Filter",
            "description": "High-flow air filter for Nissan Leaf 2018-2023. Improves engine performance.",
            "brand": "Nissan",
            "model": "Leaf",
            "year_from": 2018,
            "year_to": 2023,
            "category": "Engine Parts",
            "price": Decimal("2200.00"),
            "quantity_available": 30,
            "image_url": None
        },
        {
            "name": "Spark Plugs Set",
            "description": "Iridium spark plugs set (4pc) for Toyota Prius 2016-2022. Long-lasting performance.",
            "brand": "Toyota",
            "model": "Prius",
            "year_from": 2016,
            "year_to": 2022,
            "category": "Engine Parts",
            "price": Decimal("4500.00"),
            "quantity_available": 20,
            "image_url": None
        },
        {
            "name": "Timing Belt Kit",
            "description": "Complete timing belt kit for Honda Accord 2013-2017. Includes tensioner and pulleys.",
            "brand": "Honda",
            "model": "Accord",
            "year_from": 2013,
            "year_to": 2017,
            "category": "Engine Parts",
            "price": Decimal("15500.00"),
            "quantity_available": 8,
            "image_url": None
        },
        {
            "name": "Wiper Blade Set",
            "description": "Silicone wiper blade set for Toyota Axio 2014-2021. All-weather performance.",
            "brand": "Toyota",
            "model": "Axio",
            "year_from": 2014,
            "year_to": 2021,
            "category": "Accessories",
            "price": Decimal("1200.00"),
            "quantity_available": 50,
            "image_url": None
        },
        {
            "name": "Battery 12V 60Ah",
            "description": "Maintenance-free car battery 12V 60Ah. 2-year warranty. Fits most Japanese vehicles.",
            "brand": "Universal",
            "model": "Universal",
            "year_from": 2015,
            "year_to": 2025,
            "category": "Electrical",
            "price": Decimal("18500.00"),
            "quantity_available": 12,
            "image_url": None
        },
        {
            "name": "Brake Discs Set",
            "description": "Front brake disc rotors for Nissan Altima 2015-2020. High-quality cast iron.",
            "brand": "Nissan",
            "model": "Altima",
            "year_from": 2015,
            "year_to": 2020,
            "category": "Brake System",
            "price": Decimal("14500.00"),
            "quantity_available": 18,
            "image_url": None
        },
        {
            "name": "Radiator",
            "description": "Aluminum radiator for Mazda 3 2016-2022. Efficient cooling performance.",
            "brand": "Mazda",
            "model": "3",
            "year_from": 2016,
            "year_to": 2022,
            "category": "Cooling System",
            "price": Decimal("22500.00"),
            "quantity_available": 6,
            "image_url": None
        },
        {
            "name": "Clutch Kit",
            "description": "Complete clutch kit for Ford Focus 2012-2018. Includes pressure plate and disc.",
            "brand": "Ford",
            "model": "Focus",
            "year_from": 2012,
            "year_to": 2018,
            "category": "Transmission",
            "price": Decimal("18900.00"),
            "quantity_available": 4,
            "image_url": None
        },
        {
            "name": "Fuel Pump",
            "description": "Electric fuel pump for Toyota Corolla 2014-2021. Reliable fuel delivery.",
            "brand": "Toyota",
            "model": "Corolla",
            "year_from": 2014,
            "year_to": 2021,
            "category": "Fuel System",
            "price": Decimal("9800.00"),
            "quantity_available": 0,  # Out of stock
            "image_url": None
        },
        {
            "name": "Suspension Struts",
            "description": "Front suspension strut assembly for BMW 5 Series 2017-2023. Premium ride quality.",
            "brand": "BMW",
            "model": "5 Series",
            "year_from": 2017,
            "year_to": 2023,
            "category": "Suspension",
            "price": Decimal("28500.00"),
            "quantity_available": 10,
            "image_url": None
        },
        {
            "name": "Cabin Air Filter",
            "description": "HEPA cabin air filter for Honda CR-V 2017-2023. Filters dust and allergens.",
            "brand": "Honda",
            "model": "CR-V",
            "year_from": 2017,
            "year_to": 2023,
            "category": "Air System",
            "price": Decimal("1650.00"),
            "quantity_available": 35,
            "image_url": None
        },
        {
            "name": "Alternator",
            "description": "High-output alternator for Mazda CX-5 2013-2019. 120A capacity.",
            "brand": "Mazda",
            "model": "CX-5",
            "year_from": 2013,
            "year_to": 2019,
            "category": "Electrical",
            "price": Decimal("24500.00"),
            "quantity_available": 7,
            "image_url": None
        },
        {
            "name": "Oxygen Sensor",
            "description": "O2 sensor for Ford Mustang 2015-2022. Improves fuel efficiency.",
            "brand": "Ford",
            "model": "Mustang",
            "year_from": 2015,
            "year_to": 2022,
            "category": "Sensors",
            "price": Decimal("8900.00"),
            "quantity_available": 2,
            "image_url": None
        },
        # Additional products popular in Sri Lanka
        {
            "name": "Engine Oil 5W-30",
            "description": "Fully synthetic engine oil 5W-30, 4L pack. Suitable for all petrol engines.",
            "brand": "Toyota",
            "model": "Universal",
            "year_from": 2010,
            "year_to": 2025,
            "category": "Lubricants",
            "price": Decimal("6500.00"),
            "quantity_available": 100,
            "image_url": None
        },
        {
            "name": "Brake Pads Set",
            "description": "High-quality ceramic brake pads set (front) for Suzuki Alto 2015-2023.",
            "brand": "Suzuki",
            "model": "Alto",
            "year_from": 2015,
            "year_to": 2023,
            "category": "Brake System",
            "price": Decimal("3500.00"),
            "quantity_available": 45,
            "image_url": None
        },
        {
            "name": "Air Filter",
            "description": "High-flow air filter for Suzuki Wagon R 2017-2023. Improves engine performance.",
            "brand": "Suzuki",
            "model": "Wagon R",
            "year_from": 2017,
            "year_to": 2023,
            "category": "Engine Parts",
            "price": Decimal("1500.00"),
            "quantity_available": 60,
            "image_url": None
        },
        {
            "name": "CV Joint Boot Kit",
            "description": "CV joint boot kit for Toyota Vitz 2010-2020. Includes grease and clamps.",
            "brand": "Toyota",
            "model": "Vitz",
            "year_from": 2010,
            "year_to": 2020,
            "category": "Suspension",
            "price": Decimal("2800.00"),
            "quantity_available": 25,
            "image_url": None
        },
        {
            "name": "Timing Chain Kit",
            "description": "Complete timing chain kit for Nissan March 2010-2020. Includes guides and tensioner.",
            "brand": "Nissan",
            "model": "March",
            "year_from": 2010,
            "year_to": 2020,
            "category": "Engine Parts",
            "price": Decimal("12000.00"),
            "quantity_available": 10,
            "image_url": None
        },
        {
            "name": "Shock Absorbers (Pair)",
            "description": "Rear shock absorbers pair for Honda Fit 2014-2020. Gas-filled for smooth ride.",
            "brand": "Honda",
            "model": "Fit",
            "year_from": 2014,
            "year_to": 2020,
            "category": "Suspension",
            "price": Decimal("16000.00"),
            "quantity_available": 12,
            "image_url": None
        },
        {
            "name": "Starter Motor",
            "description": "Starter motor for Toyota Aqua 2012-2021. OEM quality replacement.",
            "brand": "Toyota",
            "model": "Aqua",
            "year_from": 2012,
            "year_to": 2021,
            "category": "Electrical",
            "price": Decimal("19500.00"),
            "quantity_available": 8,
            "image_url": None
        },
        {
            "name": "Water Pump",
            "description": "Water pump for Suzuki Swift 2010-2020. With gasket included.",
            "brand": "Suzuki",
            "model": "Swift",
            "year_from": 2010,
            "year_to": 2020,
            "category": "Cooling System",
            "price": Decimal("7500.00"),
            "quantity_available": 15,
            "image_url": None
        },
        {
            "name": "Headlight Assembly",
            "description": "Left headlight assembly for Toyota Premio 2012-2018. Clear lens.",
            "brand": "Toyota",
            "model": "Premio",
            "year_from": 2012,
            "year_to": 2018,
            "category": "Lighting",
            "price": Decimal("32000.00"),
            "quantity_available": 5,
            "image_url": None
        }
    ]

    created_products = []

    for prod_data in products_data:
        # Check if product already exists (by name + brand + model)
        existing = db.query(Product).filter(
            Product.name == prod_data["name"],
            Product.brand == prod_data["brand"],
            Product.model == prod_data["model"]
        ).first()

        if existing:
            print(f"  Product '{prod_data['name']}' ({prod_data['brand']} {prod_data['model']}) already exists, skipping...")
            created_products.append(existing)
            continue

        product = Product(
            name=prod_data["name"],
            description=prod_data["description"],
            brand=prod_data["brand"],
            model=prod_data["model"],
            year_from=prod_data["year_from"],
            year_to=prod_data["year_to"],
            category=prod_data["category"],
            price=prod_data["price"],
            quantity_available=prod_data["quantity_available"],
            image_url=prod_data.get("image_url"),
            is_active=True
        )
        db.add(product)
        created_products.append(product)
        print(f"  Created product: {prod_data['name']} ({prod_data['brand']} {prod_data['model']})")

    db.commit()
    return created_products


def seed_orders(db: Session, users: dict, products: list) -> list:
    """
    Seed sample orders for testing.
    Creates orders for the sample customer account.
    """
    customer = users.get("customer2@gmail.com")
    if not customer:
        print("  Customer not found, skipping order seeding...")
        return []

    # Check if orders already exist for this customer
    existing_orders = db.query(Order).filter(Order.user_id == customer.id).count()
    if existing_orders > 0:
        print(f"  Customer already has {existing_orders} orders, skipping order seeding...")
        return []

    # Get some products for orders
    if len(products) < 5:
        print("  Not enough products to create sample orders...")
        return []

    created_orders = []

    # Sample order 1: Delivered (shipping)
    order1 = Order(
        user_id=customer.id,
        status=OrderStatus.DELIVERED,
        delivery_method=DeliveryMethod.SHIPPING,
        total_amount=Decimal("10300.00"),
        shipping_address="123 Main Street",
        shipping_city="Colombo",
        shipping_postal_code="00100",
        customer_phone="0774567890",
        notes="Please call before delivery",
        created_at=datetime.utcnow() - timedelta(days=10)
    )
    db.add(order1)
    db.flush()

    # Add items to order 1
    item1_1 = OrderItem(
        order_id=order1.id,
        product_id=products[0].id,  # Brake Pads Set
        quantity=1,
        unit_price=products[0].price
    )
    item1_2 = OrderItem(
        order_id=order1.id,
        product_id=products[1].id,  # Engine Oil Filter
        quantity=1,
        unit_price=products[1].price
    )
    db.add(item1_1)
    db.add(item1_2)
    created_orders.append(order1)
    print(f"  Created order: {order1.id} (delivered)")

    # Sample order 2: Ready to pickup
    order2 = Order(
        user_id=customer.id,
        status=OrderStatus.READY_TO_PICKUP,
        delivery_method=DeliveryMethod.PICKUP,
        total_amount=Decimal("14700.00"),
        customer_phone="0774567890",
        notes=None,
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(order2)
    db.flush()

    item2_1 = OrderItem(
        order_id=order2.id,
        product_id=products[2].id,  # LED Headlight Bulbs
        quantity=1,
        unit_price=products[2].price
    )
    item2_2 = OrderItem(
        order_id=order2.id,
        product_id=products[3].id,  # Air Filter
        quantity=1,
        unit_price=products[3].price
    )
    db.add(item2_1)
    db.add(item2_2)
    created_orders.append(order2)
    print(f"  Created order: {order2.id} (ready_to_pickup)")

    # Sample order 3: Shipped
    order3 = Order(
        user_id=customer.id,
        status=OrderStatus.SHIPPED,
        delivery_method=DeliveryMethod.SHIPPING,
        total_amount=Decimal("20000.00"),
        shipping_address="456 Park Avenue",
        shipping_city="Kandy",
        shipping_postal_code="20000",
        customer_phone="0774567890",
        notes="Leave at door if not home",
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(order3)
    db.flush()

    item3_1 = OrderItem(
        order_id=order3.id,
        product_id=products[4].id,  # Spark Plugs Set
        quantity=1,
        unit_price=products[4].price
    )
    item3_2 = OrderItem(
        order_id=order3.id,
        product_id=products[5].id,  # Timing Belt Kit
        quantity=1,
        unit_price=products[5].price
    )
    db.add(item3_1)
    db.add(item3_2)
    created_orders.append(order3)
    print(f"  Created order: {order3.id} (shipped)")

    # Sample order 4: Pending
    order4 = Order(
        user_id=customer.id,
        status=OrderStatus.PENDING,
        delivery_method=DeliveryMethod.PICKUP,
        total_amount=Decimal("18500.00"),
        customer_phone="0774567890",
        notes=None,
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    db.add(order4)
    db.flush()

    item4_1 = OrderItem(
        order_id=order4.id,
        product_id=products[7].id,  # Battery
        quantity=1,
        unit_price=products[7].price
    )
    db.add(item4_1)
    created_orders.append(order4)
    print(f"  Created order: {order4.id} (pending)")

    # Sample order 5: Confirmed
    order5 = Order(
        user_id=customer.id,
        status=OrderStatus.CONFIRMED,
        delivery_method=DeliveryMethod.SHIPPING,
        total_amount=Decimal("23700.00"),
        shipping_address="789 Lake Road",
        shipping_city="Galle",
        shipping_postal_code="80000",
        customer_phone="0774567890",
        notes=None,
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(order5)
    db.flush()

    item5_1 = OrderItem(
        order_id=order5.id,
        product_id=products[6].id,  # Wiper Blade Set
        quantity=1,
        unit_price=products[6].price
    )
    item5_2 = OrderItem(
        order_id=order5.id,
        product_id=products[9].id,  # Radiator
        quantity=1,
        unit_price=products[9].price
    )
    db.add(item5_1)
    db.add(item5_2)
    created_orders.append(order5)
    print(f"  Created order: {order5.id} (confirmed)")

    db.commit()
    return created_orders


def run_seed():
    """Main function to run all seed operations."""
    print("\n" + "=" * 60)
    print("Starting database seeding...")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Seed users
        print("\n[1/3] Seeding users...")
        users = seed_users(db)

        # Seed products
        print("\n[2/3] Seeding products...")
        products = seed_products(db)

        # Seed orders
        print("\n[3/3] Seeding sample orders...")
        orders = seed_orders(db, users, products)

        print("\n" + "=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print("\nSummary:")
        print(f"  - Users: {len(users)} (checked/created)")
        print(f"  - Products: {len(products)} (checked/created)")
        print(f"  - Orders: {len(orders)} (created)")
        print("\nTest accounts:")
        print("  - Manager:  manager1@gmail.com / manager@1")
        print("  - Admin:    admin@gmail.com / admin@1")
        print("  - Auditor:  auditor1@gmail.com / auditor@1")
        print("  - Customer: customer2@gmail.com / customer@2222")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
