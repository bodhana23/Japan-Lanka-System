"""Email service for sending transactional emails via SMTP."""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    from app.models import Order

logger = logging.getLogger(__name__)

# Status → human-readable label + color
_STATUS_LABELS = {
    "confirmed": ("Confirmed", "#2563eb"),
    "shipped": ("Shipped", "#7c3aed"),
    "ready_to_pickup": ("Ready for Pickup", "#0891b2"),
    "delivered": ("Delivered", "#16a34a"),
    "picked_up": ("Picked Up", "#16a34a"),
    "cancelled": ("Cancelled", "#dc2626"),
}

# Status → body message (mirrors notification_service.py)
_STATUS_MESSAGES = {
    "confirmed": "Your order has been confirmed and is being processed.",
    "shipped": "Your order has been shipped and is on its way!",
    "ready_to_pickup": "Your order is ready for pickup at our store.",
    "delivered": "Your order has been delivered. Thank you for shopping with us!",
    "picked_up": "You have picked up your order. Thank you for shopping with us!",
    "cancelled": "Your order has been cancelled. If you have any questions, please contact us.",
}


def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_body: str,
    attachment_bytes: Optional[bytes] = None,
    attachment_filename: Optional[str] = None,
) -> None:
    """Send an email via SMTP.

    Silently returns (no-op) when EMAIL_NOTIFICATIONS_ENABLED is False.
    Logs a warning on failure rather than crashing the caller.
    """
    if not settings.EMAIL_NOTIFICATIONS_ENABLED:
        return

    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        logger.warning("Email notifications enabled but SMTP not configured — skipping.")
        return

    try:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = f"{to_name} <{to_email}>"

        msg.attach(MIMEText(html_body, "html"))

        if attachment_bytes and attachment_filename:
            part = MIMEApplication(attachment_bytes, _subtype="pdf")
            part.add_header(
                "Content-Disposition",
                "attachment",
                filename=attachment_filename,
            )
            msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        logger.info("Email sent to %s — subject: %s", to_email, subject)

    except Exception as exc:
        # Never let email failure crash the main request flow
        logger.error("Failed to send email to %s: %s", to_email, exc)


def _build_order_status_email(order: "Order", new_status: str) -> tuple[str, str]:
    """Return (subject, html_body) for an order status update email."""
    order_id_short = str(order.id)[:8].upper()
    label, color = _STATUS_LABELS.get(new_status, (new_status.replace("_", " ").title(), "#374151"))
    message = _STATUS_MESSAGES.get(new_status, f"Your order status has been updated to {label}.")

    if order.customer:
        customer_name = order.customer.full_name
    elif order.offline_customer_name:
        customer_name = order.offline_customer_name
    else:
        customer_name = "Valued Customer"

    subject = f"Order #{order_id_short} – {label} | Japan Lanka"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">
                Japan Lanka
              </p>
              <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">
                Automobile Parts &amp; Accessories
              </p>
            </td>
          </tr>

          <!-- Status badge -->
          <tr>
            <td style="padding:32px 32px 0;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Order Status Update
              </p>
              <span style="display:inline-block;background:{color};color:#ffffff;font-size:15px;font-weight:bold;padding:6px 18px;border-radius:20px;">
                {label}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;">
                Hi <strong>{customer_name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                {message}
              </p>

              <!-- Order detail box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Order Reference</p>
                    <p style="margin:0;color:#111827;font-size:18px;font-weight:bold;font-family:monospace;">#{order_id_short}</p>
                  </td>
                </tr>
              </table>
"""

    # Extra note for delivered/picked_up with bill attached
    if new_status in ("delivered", "picked_up"):
        html_body += """
              <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;">
                📎 <strong>Your invoice is attached</strong> to this email as a PDF. Please keep it for your records.
              </p>
"""

    html_body += f"""
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
                Thank you for shopping with Japan Lanka.<br/>
                If you have questions, please contact our support team.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return subject, html_body


def send_order_status_email(order: "Order", new_status: str, include_bill: bool = False) -> None:
    """Send an order status update email to the customer.

    Called as a FastAPI BackgroundTask — runs after the HTTP response is sent.
    Skips silently for offline orders (no customer email).

    Args:
        order: The Order model instance (with customer and items loaded).
        new_status: The new order status value string.
        include_bill: If True, attach the PDF bill to the email.
    """
    if not order.customer or not order.customer.email:
        return

    subject, html_body = _build_order_status_email(order, new_status)

    attachment_bytes: Optional[bytes] = None
    attachment_filename: Optional[str] = None

    if include_bill:
        try:
            from app.services.bill_service import generate_bill_pdf
            pdf_buffer = generate_bill_pdf(order)
            attachment_bytes = pdf_buffer.read()
            order_id_short = str(order.id)[:8].upper()
            attachment_filename = f"Japan_Lanka_Invoice_{order_id_short}.pdf"
        except Exception as exc:
            logger.error("Failed to generate bill PDF for order %s: %s", order.id, exc)
            # Send email without attachment rather than failing entirely

    send_email(
        to_email=order.customer.email,
        to_name=order.customer.full_name,
        subject=subject,
        html_body=html_body,
        attachment_bytes=attachment_bytes,
        attachment_filename=attachment_filename,
    )
