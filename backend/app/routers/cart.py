"""Cart router for shopping cart management."""

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cart, CartItem, Product, Customer
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
)
from app.utils.deps import get_current_customer

router = APIRouter(prefix="/cart", tags=["Cart"])


def get_or_create_cart(customer: Customer, db: Session) -> Cart:
    """Get customer's cart or create one if it doesn't exist."""
    cart = db.query(Cart).filter(Cart.customer_id == customer.id).first()
    if not cart:
        cart = Cart(customer_id=customer.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def cart_to_response(cart: Cart) -> CartResponse:
    """Convert Cart model to CartResponse with calculated totals."""
    items = []
    total_items = 0
    total_price = Decimal("0")

    for item in cart.items:
        if item.product:
            subtotal = item.product.price * item.quantity
            total_items += item.quantity
            total_price += subtotal

            items.append(CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                product_brand=item.product.brand,
                product_image_url=item.product.image_url,
                unit_price=item.product.price,
                quantity=item.quantity,
                subtotal=subtotal,
                available_stock=item.product.quantity_available,
                created_at=item.created_at
            ))

    return CartResponse(
        id=cart.id,
        customer_id=cart.customer_id,
        items=items,
        total_items=total_items,
        total_price=total_price,
        created_at=cart.created_at,
        updated_at=cart.updated_at
    )


@router.get("", response_model=CartResponse)
async def get_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get current customer's cart with all items."""
    cart = get_or_create_cart(current_customer, db)
    return cart_to_response(cart)


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    item_data: CartItemCreate,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Add an item to the cart."""
    # Validate product exists and is active
    product = db.query(Product).filter(
        Product.id == item_data.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive"
        )

    # Check stock availability
    if product.quantity_available < item_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {product.quantity_available}"
        )

    cart = get_or_create_cart(current_customer, db)

    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_data.product_id
    ).first()

    if existing_item:
        # Update quantity
        new_quantity = existing_item.quantity + item_data.quantity
        if new_quantity > product.quantity_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {product.quantity_available}, in cart: {existing_item.quantity}"
            )
        existing_item.quantity = new_quantity
    else:
        # Create new cart item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)

    db.commit()
    db.refresh(cart)

    return cart_to_response(cart)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: UUID,
    update_data: CartItemUpdate,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Update cart item quantity."""
    cart = get_or_create_cart(current_customer, db)

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    # Check stock availability
    if cart_item.product and cart_item.product.quantity_available < update_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {cart_item.product.quantity_available}"
        )

    cart_item.quantity = update_data.quantity
    db.commit()
    db.refresh(cart)

    return cart_to_response(cart)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: UUID,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Remove an item from the cart."""
    cart = get_or_create_cart(current_customer, db)

    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    db.delete(cart_item)
    db.commit()
    db.refresh(cart)

    return cart_to_response(cart)


@router.delete("", response_model=CartResponse)
async def clear_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Clear all items from the cart."""
    cart = get_or_create_cart(current_customer, db)

    # Delete all cart items
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(cart)

    return cart_to_response(cart)
