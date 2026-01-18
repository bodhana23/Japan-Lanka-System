"""
Seed script to populate orders and return requests for a specific user.
This creates sample data for jayawickramabodhana@gmail.com

Run with: python -m app.seed_user_data
"""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderStatus, DeliveryMethod
from app.models.order_item import OrderItem
from app.models.return_request import ReturnRequest, ReturnStatus


TARGET_EMAIL = "jayawickramabodhana@gmail.com"


def get_products_by_category(db: Session) -> dict:
    """Get products organized by category for easy selection."""
    products = db.query(Product).filter(Product.is_active == True).all()

    # Create a dict for easy lookup
    product_dict = {
        "brake_pads": None,
        "oil_filter": None,
        "air_filter": None,
        "spark_plugs": None,
        "battery": None,
        "headlight": None,
        "wiper_blades": None,
        "alternator": None,
        "timing_belt": None,
        "water_pump": None,
    }

    for p in products:
        name_lower = p.name.lower()
        if "brake pad" in name_lower and not product_dict["brake_pads"]:
            product_dict["brake_pads"] = p
        elif "oil filter" in name_lower and not product_dict["oil_filter"]:
            product_dict["oil_filter"] = p
        elif "air filter" in name_lower and not product_dict["air_filter"]:
            product_dict["air_filter"] = p
        elif "spark plug" in name_lower and not product_dict["spark_plugs"]:
            product_dict["spark_plugs"] = p
        elif "battery" in name_lower and not product_dict["battery"]:
            product_dict["battery"] = p
        elif "headlight" in name_lower and not product_dict["headlight"]:
            product_dict["headlight"] = p
        elif "wiper" in name_lower and not product_dict["wiper_blades"]:
            product_dict["wiper_blades"] = p
        elif "alternator" in name_lower and not product_dict["alternator"]:
            product_dict["alternator"] = p
        elif "timing" in name_lower and not product_dict["timing_belt"]:
            product_dict["timing_belt"] = p
        elif "water pump" in name_lower and not product_dict["water_pump"]:
            product_dict["water_pump"] = p

    return product_dict


def seed_orders_for_user(db: Session, user: User, products: dict) -> list:
    """Create 5 sample orders for the specified user."""
    created_orders = []

    # Check if user already has orders
    existing_orders = db.query(Order).filter(Order.user_id == user.id).count()
    if existing_orders > 0:
        print(f"  User already has {existing_orders} orders. Skipping order creation...")
        # Return existing orders for return request creation
        return db.query(Order).filter(Order.user_id == user.id).all()

    # Get user's phone number or use default
    phone = user.phone_number or "0771234567"

    # Order 1: Delivered (shipping to Colombo) - 3 items
    order1_items = [
        (products.get("brake_pads"), 1),
        (products.get("oil_filter"), 2),
        (products.get("air_filter"), 1),
    ]
    order1_items = [(p, q) for p, q in order1_items if p is not None]
    order1_total = sum(p.price * q for p, q in order1_items)

    order1 = Order(
        user_id=user.id,
        status=OrderStatus.DELIVERED,
        delivery_method=DeliveryMethod.SHIPPING,
        total_amount=order1_total,
        shipping_address="45 Galle Road, Colombo 03",
        shipping_city="Colombo",
        shipping_postal_code="00300",
        notes="Please call before delivery",
        created_at=datetime.utcnow() - timedelta(days=15)
    )
    db.add(order1)
    db.flush()

    for product, qty in order1_items:
        item = OrderItem(
            order_id=order1.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price
        )
        db.add(item)

    created_orders.append(order1)
    print(f"  Created Order 1: {str(order1.id)[:8]}... (delivered, shipping) - Rs. {order1_total:,.2f}")

    # Order 2: Ready to Pickup - 2 items
    order2_items = [
        (products.get("spark_plugs"), 1),
        (products.get("battery"), 1),
    ]
    order2_items = [(p, q) for p, q in order2_items if p is not None]
    order2_total = sum(p.price * q for p, q in order2_items)

    order2 = Order(
        user_id=user.id,
        status=OrderStatus.READY_TO_PICKUP,
        delivery_method=DeliveryMethod.PICKUP,
        total_amount=order2_total,
        notes="Will pick up on weekend",
        created_at=datetime.utcnow() - timedelta(days=5)
    )
    db.add(order2)
    db.flush()

    for product, qty in order2_items:
        item = OrderItem(
            order_id=order2.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price
        )
        db.add(item)

    created_orders.append(order2)
    print(f"  Created Order 2: {str(order2.id)[:8]}... (ready_to_pickup) - Rs. {order2_total:,.2f}")

    # Order 3: Shipped (to Kandy) - 2 items
    order3_items = [
        (products.get("headlight"), 1),
        (products.get("wiper_blades"), 2),
    ]
    order3_items = [(p, q) for p, q in order3_items if p is not None]
    order3_total = sum(p.price * q for p, q in order3_items)

    order3 = Order(
        user_id=user.id,
        status=OrderStatus.SHIPPED,
        delivery_method=DeliveryMethod.SHIPPING,
        total_amount=order3_total,
        shipping_address="123 Kandy Road, Peradeniya",
        shipping_city="Kandy",
        shipping_postal_code="20400",
        notes="Leave at the gate if not home",
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(order3)
    db.flush()

    for product, qty in order3_items:
        item = OrderItem(
            order_id=order3.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price
        )
        db.add(item)

    created_orders.append(order3)
    print(f"  Created Order 3: {str(order3.id)[:8]}... (shipped) - Rs. {order3_total:,.2f}")

    # Order 4: Pending (to Negombo) - 1 item
    order4_items = [
        (products.get("alternator"), 1),
    ]
    order4_items = [(p, q) for p, q in order4_items if p is not None]
    order4_total = sum(p.price * q for p, q in order4_items)

    order4 = Order(
        user_id=user.id,
        status=OrderStatus.PENDING,
        delivery_method=DeliveryMethod.SHIPPING,
        total_amount=order4_total,
        shipping_address="78 Beach Road, Negombo",
        shipping_city="Negombo",
        shipping_postal_code="11500",
        notes=None,
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    db.add(order4)
    db.flush()

    for product, qty in order4_items:
        item = OrderItem(
            order_id=order4.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price
        )
        db.add(item)

    created_orders.append(order4)
    print(f"  Created Order 4: {str(order4.id)[:8]}... (pending) - Rs. {order4_total:,.2f}")

    # Order 5: Confirmed (pickup) - 2 items
    order5_items = [
        (products.get("timing_belt"), 1),
        (products.get("water_pump"), 1),
    ]
    order5_items = [(p, q) for p, q in order5_items if p is not None]
    order5_total = sum(p.price * q for p, q in order5_items)

    order5 = Order(
        user_id=user.id,
        status=OrderStatus.CONFIRMED,
        delivery_method=DeliveryMethod.PICKUP,
        total_amount=order5_total,
        notes="Urgent - need for repair",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(order5)
    db.flush()

    for product, qty in order5_items:
        item = OrderItem(
            order_id=order5.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price
        )
        db.add(item)

    created_orders.append(order5)
    print(f"  Created Order 5: {str(order5.id)[:8]}... (confirmed, pickup) - Rs. {order5_total:,.2f}")

    db.commit()
    return created_orders


def seed_return_requests(db: Session, user: User, orders: list) -> list:
    """Create 2 sample return requests for the user."""
    created_returns = []

    # Check if user already has return requests
    existing_returns = db.query(ReturnRequest).filter(ReturnRequest.user_id == user.id).count()
    if existing_returns > 0:
        print(f"  User already has {existing_returns} return requests. Skipping...")
        return []

    # Find delivered and ready_to_pickup orders
    delivered_order = None
    pickup_order = None

    for order in orders:
        if order.status == OrderStatus.DELIVERED and not delivered_order:
            delivered_order = order
        elif order.status == OrderStatus.READY_TO_PICKUP and not pickup_order:
            pickup_order = order

    # Return Request 1: Pending return for delivered order
    if delivered_order:
        return1 = ReturnRequest(
            order_id=delivered_order.id,
            user_id=user.id,
            reason="Item doesn't fit my vehicle model - Toyota Corolla 2018. The brake pads are slightly larger than expected and don't match the original specifications.",
            status=ReturnStatus.PENDING,
            admin_notes=None,
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(return1)
        db.flush()
        created_returns.append(return1)
        print(f"  Created Return Request 1: {str(return1.id)[:8]}... (pending) for delivered order")

    # Return Request 2: Approved return for ready_to_pickup order
    if pickup_order:
        return2 = ReturnRequest(
            order_id=pickup_order.id,
            user_id=user.id,
            reason="Received damaged packaging, product has visible scratches on the surface. The battery casing appears to have been dropped during shipping.",
            status=ReturnStatus.APPROVED,
            admin_notes="Approved for full refund. Customer provided photos of damage. Replacement will be arranged.",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(return2)
        db.flush()
        created_returns.append(return2)
        print(f"  Created Return Request 2: {str(return2.id)[:8]}... (approved) for pickup order")

    db.commit()

    # Print final IDs
    for r in created_returns:
        print(f"    -> Return Request ID: {r.id}")

    return created_returns


def run_seed():
    """Main function to seed data for the target user."""
    print("\n" + "=" * 60)
    print(f"Seeding data for: {TARGET_EMAIL}")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Find the user
        user = db.query(User).filter(User.email == TARGET_EMAIL).first()

        if not user:
            print(f"\nERROR: User with email '{TARGET_EMAIL}' not found!")
            print("Please make sure you've logged in with this Google account first.")
            print("=" * 60 + "\n")
            return

        print(f"\nFound user: {user.full_name} (ID: {user.id})")

        # Get products
        print("\n[1/3] Loading products...")
        products = get_products_by_category(db)
        available_products = [k for k, v in products.items() if v is not None]
        print(f"  Found {len(available_products)} matching products: {', '.join(available_products)}")

        # Seed orders
        print("\n[2/3] Creating orders...")
        orders = seed_orders_for_user(db, user, products)

        # Seed return requests
        print("\n[3/3] Creating return requests...")
        returns = seed_return_requests(db, user, orders)

        print("\n" + "=" * 60)
        print("Seeding completed successfully!")
        print("=" * 60)
        print(f"\nSummary for {user.email}:")
        print(f"  - Orders: {len(orders)}")
        print(f"  - Return Requests: {len(returns)}")
        print("\nOrder statuses:")
        for order in orders:
            print(f"  - {str(order.id)[:8]}... : {order.status.value} ({order.delivery_method.value})")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
