"""
PayHere Payment Gateway Integration

This module handles PayHere payment notifications for order payments.
Currently configured for sandbox/demo mode only.
"""
import logging
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus, PaymentStatus

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/payhere/notify", response_class=PlainTextResponse)
async def payhere_notify(
    merchant_id: str = Form(...),
    order_id: str = Form(...),
    payment_id: str = Form(...),
    payhere_amount: str = Form(...),
    payhere_currency: str = Form(...),
    status_code: str = Form(...),
    md5sig: str = Form(...),
    custom_1: Optional[str] = Form(None),
    custom_2: Optional[str] = Form(None),
    method: Optional[str] = Form(None),
    status_message: Optional[str] = Form(None),
    card_holder_name: Optional[str] = Form(None),
    card_no: Optional[str] = Form(None),
    card_expiry: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    PayHere server-to-server notification endpoint.

    This endpoint receives payment notifications from PayHere's server.
    It must always return HTTP 200 with body "OK" to acknowledge receipt.

    Status codes from PayHere:
    - 2: Payment successful
    - 0: Pending
    - -1: Cancelled
    - -2: Failed
    - -3: Chargedback

    Note: MD5 signature verification is NOT implemented (sandbox demo only).
    For production, implement proper hash verification.
    """
    # Log the full payload for debugging
    logger.info(
        f"PayHere notification received: "
        f"order_id={order_id}, "
        f"payment_id={payment_id}, "
        f"status_code={status_code}, "
        f"payhere_amount={payhere_amount}, "
        f"payhere_currency={payhere_currency}, "
        f"md5sig={md5sig}, "
        f"merchant_id={merchant_id}, "
        f"method={method}, "
        f"status_message={status_message}"
    )

    try:
        # Parse order_id as UUID
        order_uuid = UUID(order_id)

        # Find the order in database
        order = db.query(Order).filter(Order.id == order_uuid).first()

        if not order:
            logger.error(f"Order not found: {order_id}")
            # Still return OK to acknowledge receipt
            return "OK"

        # Process based on status code
        status_code_int = int(status_code)

        if status_code_int == 2:
            # Payment successful
            logger.info(f"Payment successful for order {order_id}")

            # Update paid amount
            paid_now = Decimal(payhere_amount)
            previous_paid = Decimal(str(order.paid_amount or 0))
            order.paid_amount = previous_paid + paid_now

            # Calculate remaining amount
            total = Decimal(str(order.total_amount))
            order.remaining_amount = max(Decimal("0"), total - order.paid_amount)

            # Update payment status
            if order.paid_amount >= total:
                order.payment_status = PaymentStatus.PAID
                logger.info(f"Order {order_id} fully paid")
            elif order.paid_amount > 0:
                order.payment_status = PaymentStatus.PARTIALLY_PAID
                logger.info(
                    f"Order {order_id} partially paid: "
                    f"paid {order.paid_amount}, remaining {order.remaining_amount}"
                )
            else:
                order.payment_status = PaymentStatus.NOT_PAID

            # Mark order as in_progress once payment received
            if order.status == OrderStatus.PENDING:
                order.status = OrderStatus.IN_PROGRESS
                logger.info(f"Order {order_id} marked as IN_PROGRESS")

            # Store PayHere payment reference
            order.payhere_payment_id = payment_id

            db.commit()

        else:
            # Payment failed, cancelled, or pending
            status_descriptions = {
                0: "pending",
                -1: "cancelled",
                -2: "failed",
                -3: "chargedback"
            }
            status_desc = status_descriptions.get(status_code_int, "unknown")

            logger.warning(
                f"Payment {status_desc} for order {order_id}: "
                f"status_code={status_code}, message={status_message}"
            )

            # Update order notes with payment failure info
            failure_note = f"Payment {status_desc}: {status_message or 'No message'}"
            if order.notes:
                order.notes = f"{order.notes}\n{failure_note}"
            else:
                order.notes = failure_note

            db.commit()

    except ValueError as e:
        logger.error(f"Invalid order_id format: {order_id}, error: {e}")
    except Exception as e:
        logger.error(f"Error processing PayHere notification: {e}")

    # Always return OK to acknowledge receipt
    return "OK"


@router.get("/payhere/status/{order_id}")
async def get_payment_status(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Get payment status for an order.
    This is a helper endpoint for frontend to check payment status.
    """
    try:
        order_uuid = UUID(order_id)
        order = db.query(Order).filter(Order.id == order_uuid).first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        return {
            "order_id": str(order.id),
            "order_status": order.status.value,
            "payment_status": order.payment_status.value,
            "total_amount": float(order.total_amount),
            "paid_amount": float(order.paid_amount or 0),
            "remaining_amount": float(order.remaining_amount or 0),
            "delivery_fee": float(order.delivery_fee or 0),
            "is_fully_paid": order.payment_status == PaymentStatus.PAID,
            "payhere_payment_id": order.payhere_payment_id
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
