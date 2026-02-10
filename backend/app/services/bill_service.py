"""Bill PDF generation service."""

from io import BytesIO
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

if TYPE_CHECKING:
    from app.models import Order


def generate_bill_pdf(order: "Order") -> BytesIO:
    """Generate a PDF bill/invoice for an order.

    Args:
        order: The Order model instance with items loaded.

    Returns:
        BytesIO buffer containing the PDF data.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=24,
        spaceAfter=6,
        alignment=1,  # Center
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
        alignment=1,  # Center
    )
    heading_style = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=12,
        spaceAfter=6,
    )
    normal_style = styles["Normal"]

    elements = []

    # Company Header
    elements.append(Paragraph("Japan Lanka", title_style))
    elements.append(Paragraph("Automobile Parts & Accessories", subtitle_style))
    elements.append(Spacer(1, 10 * mm))

    # Invoice Title
    elements.append(Paragraph("INVOICE", ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=18,
        alignment=1,
        textColor=colors.HexColor("#333333"),
    )))
    elements.append(Spacer(1, 8 * mm))

    # Order Details
    order_id_short = str(order.id)[:8].upper()
    order_date = order.created_at.strftime("%d %b %Y, %I:%M %p")
    order_type = "Offline Sale" if order.sales_channel.value == "offline" else "Online Order"

    # Payment status - offline sales are paid, online orders are unpaid (until payment gateway is implemented)
    is_offline = order.sales_channel.value == "offline"
    payment_status = "PAID" if is_offline else "UNPAID"
    payment_method = "Cash" if is_offline else "Pending"

    # Customer name logic
    if order.customer:
        customer_name = order.customer.full_name
    elif order.offline_customer_name:
        customer_name = order.offline_customer_name
    else:
        customer_name = "Walk-in Customer"

    # Info table
    info_data = [
        ["Order ID:", order_id_short, "Order Date:", order_date],
        ["Customer:", customer_name, "Order Type:", order_type],
    ]

    info_table = Table(info_data, colWidths=[25 * mm, 55 * mm, 25 * mm, 55 * mm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8 * mm))

    # Items Table
    elements.append(Paragraph("Order Items", heading_style))

    # Table header
    items_header = ["#", "Item", "Qty", "Unit Price", "Total"]
    items_data = [items_header]

    # Table rows
    for idx, item in enumerate(order.items, start=1):
        product_name = item.product.name if item.product else "Unknown Product"
        unit_price = Decimal(str(item.unit_price))
        quantity = item.quantity
        line_total = unit_price * quantity

        items_data.append([
            str(idx),
            product_name,
            str(quantity),
            f"Rs. {unit_price:,.2f}",
            f"Rs. {line_total:,.2f}",
        ])

    # Total row
    total_amount = Decimal(str(order.total_amount))
    items_data.append(["", "", "", "Subtotal:", f"Rs. {total_amount:,.2f}"])

    items_table = Table(
        items_data,
        colWidths=[10 * mm, 80 * mm, 15 * mm, 30 * mm, 35 * mm],
    )
    items_table.setStyle(TableStyle([
        # Header styling
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        # Body styling
        ("FONTNAME", (0, 1), (-1, -2), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -2), 10),
        ("BOTTOMPADDING", (0, 1), (-1, -2), 6),
        ("TOPPADDING", (0, 1), (-1, -2), 6),
        # Total row styling
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 11),
        ("TOPPADDING", (0, -1), (-1, -1), 10),
        ("LINEABOVE", (3, -1), (-1, -1), 1, colors.black),
        # Alignment
        ("ALIGN", (0, 0), (0, -1), "CENTER"),  # # column
        ("ALIGN", (2, 0), (2, -1), "CENTER"),  # Qty column
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),  # Price columns
        # Grid lines
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#dddddd")),
        ("LINEBELOW", (0, 1), (-1, -2), 0.5, colors.HexColor("#eeeeee")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8 * mm))

    # Payment Status and Total Due Section
    payment_section_style = ParagraphStyle(
        "PaymentSection",
        parent=styles["Heading2"],
        fontSize=11,
        spaceBefore=6,
        spaceAfter=6,
    )

    # Payment info table
    payment_status_color = colors.HexColor("#27ae60") if is_offline else colors.HexColor("#e74c3c")
    amount_due = Decimal("0") if is_offline else total_amount

    payment_data = [
        ["Payment Status:", payment_status],
        ["Payment Method:", payment_method],
        ["Total Due:", f"Rs. {amount_due:,.2f}"],
    ]

    payment_table = Table(payment_data, colWidths=[40 * mm, 50 * mm])
    payment_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
        ("TEXTCOLOR", (1, 0), (1, 0), payment_status_color),  # Payment status color
        ("FONTNAME", (1, 2), (1, 2), "Helvetica-Bold"),  # Total Due bold
        ("FONTSIZE", (1, 2), (1, 2), 14),  # Total Due larger
        ("TEXTCOLOR", (1, 2), (1, 2), colors.HexColor("#c0392b") if not is_offline else colors.HexColor("#27ae60")),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(payment_table)
    elements.append(Spacer(1, 10 * mm))

    # Footer
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.grey,
        alignment=1,
    )
    generated_at = datetime.now().strftime("%d %b %Y, %I:%M %p")
    elements.append(Paragraph(f"Generated on {generated_at}", footer_style))
    elements.append(Paragraph("Thank you for your business!", footer_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
