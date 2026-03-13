"""Analytics router for financial reporting."""

import calendar
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc, case, literal
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus, SalesChannel
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.return_request import ReturnRequest
from app.models.return_item import ReturnItem
from app.schemas.analytics import (
    FinancialSummaryResponse,
    MonthlySalesData,
    DailyTrendEntry,
    BrandSalesData,
    TopSellingPart,
    RevenueByCategory,
    ReturnAnalyticsResponse,
    MonthlyReturnData,
    TopReturnedProduct,
    ReturnReasonBreakdown,
    OrderPipelineResponse,
    StatusCount,
    SalesChannelComparisonResponse,
    ChannelStats,
    MonthlyChannelData,
)
from app.utils.deps import require_staff
from app.utils.timezone import get_current_time

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/financial-summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    months: int = Query(3, ge=1, le=12, description="Number of months to include"),
    db: Session = Depends(get_db),
    _current_employee=Depends(require_staff),
):
    """
    Get financial analytics summary for the admin dashboard.

    Returns monthly sales data, brand sales, and revenue summaries
    for the specified number of past months.
    Only non-cancelled orders are included in calculations.
    """
    now = get_current_time()

    # Calculate start date: first day of N months ago
    start_year = now.year
    start_month = now.month - months + 1
    while start_month <= 0:
        start_month += 12
        start_year -= 1
    start_date = datetime(start_year, start_month, 1)

    # Base filters for non-cancelled orders in the date range
    base_order_filters = [
        Order.status != OrderStatus.CANCELLED,
        Order.created_at >= start_date,
    ]

    # ── 1. Monthly Sales Data ──
    monthly_data = []
    current_date = start_date

    while current_date <= now:
        year = current_date.year
        month = current_date.month
        month_name = f"{calendar.month_name[month]} {year}"

        last_day = calendar.monthrange(year, month)[1]
        month_start = datetime(year, month, 1)
        month_end = datetime(year, month, last_day, 23, 59, 59)

        month_filters = [
            Order.status != OrderStatus.CANCELLED,
            Order.created_at >= month_start,
            Order.created_at <= month_end,
        ]

        # a) Total revenue and order count (paid_amount = actual collected cash)
        revenue_result = db.query(
            func.coalesce(func.sum(Order.paid_amount), 0),
            func.count(Order.id),
        ).filter(*month_filters).first()

        total_revenue = float(revenue_result[0])
        order_count = int(revenue_result[1])

        # b) Top 3 selling parts by quantity
        top_parts = (
            db.query(
                Product.name,
                func.sum(OrderItem.quantity).label("total_qty"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(*month_filters)
            .group_by(Product.name)
            .order_by(desc("total_qty"))
            .limit(3)
            .all()
        )
        top_selling_parts = [
            TopSellingPart(name=row[0], units=int(row[1]))
            for row in top_parts
        ]

        # c) Revenue by category
        category_results = (
            db.query(
                Product.category,
                func.sum(OrderItem.quantity * OrderItem.unit_price).label("cat_revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(*month_filters)
            .group_by(Product.category)
            .order_by(desc("cat_revenue"))
            .all()
        )
        revenue_by_category = [
            RevenueByCategory(category=row[0], revenue=float(row[1]))
            for row in category_results
        ]

        # d) Daily trend - all days of the month
        trend_end = min(month_end, now)
        trend_start = month_start
        days_in_month = calendar.monthrange(year, month)[1]

        daily_trend_results = (
            db.query(
                func.date(Order.created_at).label("day"),
                func.coalesce(func.sum(Order.paid_amount), 0).label("daily_revenue"),
            )
            .filter(
                Order.status != OrderStatus.CANCELLED,
                Order.created_at >= trend_start,
                Order.created_at <= trend_end,
            )
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at))
            .all()
        )

        daily_map = {str(row[0]): float(row[1]) for row in daily_trend_results}
        daily_trend = []
        for i in range(days_in_month):
            day = trend_start + timedelta(days=i)
            if day <= trend_end:
                day_str = str(day.date())
                label = day.strftime("%-d %b")
                daily_trend.append(DailyTrendEntry(
                    date=label,
                    revenue=daily_map.get(day_str, 0.0)
                ))

        monthly_data.append(MonthlySalesData(
            month=month_name,
            sales=total_revenue,
            orders=order_count,
            topSellingParts=top_selling_parts,
            revenueByCategory=revenue_by_category,
            dailyTrend=daily_trend,
        ))

        # Advance to next month
        if month == 12:
            current_date = datetime(year + 1, 1, 1)
        else:
            current_date = datetime(year, month + 1, 1)

    # ── 2. Brand Sales (top 5 across full date range) ──
    brand_results = (
        db.query(
            Product.brand,
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_sales"),
            func.sum(OrderItem.quantity).label("total_units"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(*base_order_filters)
        .group_by(Product.brand)
        .order_by(desc("total_sales"))
        .limit(5)
        .all()
    )
    brand_sales = [
        BrandSalesData(brand=row[0], sales=float(row[1]), units=int(row[2]))
        for row in brand_results
    ]

    # ── 3. Summary calculations ──
    monthly_revenue = monthly_data[-1].sales if monthly_data else 0.0
    total_sales = sum(m.sales for m in monthly_data)
    num_months = len(monthly_data)
    yearly_revenue = (total_sales * 12 / num_months) if num_months > 0 else 0.0

    return FinancialSummaryResponse(
        salesData=monthly_data,
        brandSales=brand_sales,
        monthlyRevenue=monthly_revenue,
        yearlyRevenue=yearly_revenue,
    )


@router.get("/return-analytics", response_model=ReturnAnalyticsResponse)
def get_return_analytics(
    months: int = Query(3, ge=1, le=12, description="Number of months to include"),
    db: Session = Depends(get_db),
    _current_employee=Depends(require_staff),
):
    """Get return analytics: return rate, monthly returns, top returned products, reason breakdown."""
    now = get_current_time()

    start_year = now.year
    start_month = now.month - months + 1
    while start_month <= 0:
        start_month += 12
        start_year -= 1
    start_date = datetime(start_year, start_month, 1)

    # Total non-cancelled orders in date range
    total_orders = db.query(func.count(Order.id)).filter(
        Order.status != OrderStatus.CANCELLED,
        Order.created_at >= start_date,
    ).scalar() or 0

    # Total return requests in date range
    total_returns = db.query(func.count(ReturnRequest.id)).filter(
        ReturnRequest.created_at >= start_date,
    ).scalar() or 0

    # Orders with at least one return request
    orders_with_returns = db.query(func.count(func.distinct(ReturnRequest.order_id))).filter(
        ReturnRequest.created_at >= start_date,
    ).scalar() or 0

    return_rate = (orders_with_returns / total_orders * 100) if total_orders > 0 else 0.0

    # Monthly returns
    monthly_returns = []
    current_date = start_date
    while current_date <= now:
        year = current_date.year
        month = current_date.month
        month_name = f"{calendar.month_name[month]} {year}"
        last_day = calendar.monthrange(year, month)[1]
        month_start = datetime(year, month, 1)
        month_end = datetime(year, month, last_day, 23, 59, 59)

        month_return_count = db.query(func.count(ReturnRequest.id)).filter(
            ReturnRequest.created_at >= month_start,
            ReturnRequest.created_at <= month_end,
        ).scalar() or 0

        # Refund value: sum of ReturnItem.quantity * OrderItem.unit_price
        refund_value = db.query(
            func.coalesce(func.sum(ReturnItem.quantity * OrderItem.unit_price), 0)
        ).join(
            OrderItem, ReturnItem.order_item_id == OrderItem.id
        ).join(
            ReturnRequest, ReturnItem.return_request_id == ReturnRequest.id
        ).filter(
            ReturnRequest.created_at >= month_start,
            ReturnRequest.created_at <= month_end,
        ).scalar() or 0

        monthly_returns.append(MonthlyReturnData(
            month=month_name,
            returns=month_return_count,
            refundValue=float(refund_value),
        ))

        if month == 12:
            current_date = datetime(year + 1, 1, 1)
        else:
            current_date = datetime(year, month + 1, 1)

    # Top 5 returned products
    top_returned = (
        db.query(
            Product.name,
            func.sum(ReturnItem.quantity).label("total_qty"),
        )
        .join(OrderItem, ReturnItem.order_item_id == OrderItem.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(ReturnRequest, ReturnItem.return_request_id == ReturnRequest.id)
        .filter(ReturnRequest.created_at >= start_date)
        .group_by(Product.name)
        .order_by(desc("total_qty"))
        .limit(5)
        .all()
    )
    top_returned_products = [
        TopReturnedProduct(name=row[0], returns=int(row[1]))
        for row in top_returned
    ]

    # Reason breakdown
    reason_results = (
        db.query(
            ReturnRequest.reason,
            func.count(ReturnRequest.id).label("cnt"),
        )
        .filter(ReturnRequest.created_at >= start_date)
        .group_by(ReturnRequest.reason)
        .order_by(desc("cnt"))
        .all()
    )
    reason_breakdown = [
        ReturnReasonBreakdown(reason=row[0], count=int(row[1]))
        for row in reason_results
    ]

    return ReturnAnalyticsResponse(
        returnRate=round(return_rate, 2),
        totalReturns=total_returns,
        totalOrders=total_orders,
        monthlyReturns=monthly_returns,
        topReturnedProducts=top_returned_products,
        reasonBreakdown=reason_breakdown,
    )


@router.get("/order-pipeline", response_model=OrderPipelineResponse)
def get_order_pipeline(
    db: Session = Depends(get_db),
    _current_employee=Depends(require_staff),
):
    """
    Get current order status pipeline — snapshot of orders across all statuses.

    For ready_to_pickup and delivered, only counts orders from the last 30 days.
    For all other statuses, counts all orders regardless of date.
    """
    now = get_current_time()
    thirty_days_ago = now - timedelta(days=30)

    # Statuses that should only show last 30 days
    date_limited_statuses = {OrderStatus.READY_TO_PICKUP, OrderStatus.DELIVERED, OrderStatus.PICKED_UP}

    status_order = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        OrderStatus.READY_TO_PICKUP,
        OrderStatus.DELIVERED,
        OrderStatus.PICKED_UP,
        OrderStatus.CANCELLED,
    ]

    status_map = {}

    # Query statuses without date limit (pending, confirmed, shipped, cancelled)
    unlimited_statuses = [s for s in status_order if s not in date_limited_statuses]
    unlimited_results = (
        db.query(
            Order.status,
            func.count(Order.id).label("total"),
            func.count(case(
                (Order.sales_channel == SalesChannel.ONLINE, Order.id),
            )).label("online_count"),
            func.count(case(
                (Order.sales_channel == SalesChannel.OFFLINE, Order.id),
            )).label("offline_count"),
        )
        .filter(Order.status.in_(unlimited_statuses))
        .group_by(Order.status)
        .all()
    )
    for row in unlimited_results:
        status_map[row[0]] = {
            "count": int(row[1]),
            "onlineCount": int(row[2]),
            "offlineCount": int(row[3]),
        }

    # Query date-limited statuses (ready_to_pickup, delivered) — last 30 days only
    limited_results = (
        db.query(
            Order.status,
            func.count(Order.id).label("total"),
            func.count(case(
                (Order.sales_channel == SalesChannel.ONLINE, Order.id),
            )).label("online_count"),
            func.count(case(
                (Order.sales_channel == SalesChannel.OFFLINE, Order.id),
            )).label("offline_count"),
        )
        .filter(
            Order.status.in_(list(date_limited_statuses)),
            Order.created_at >= thirty_days_ago,
        )
        .group_by(Order.status)
        .all()
    )
    for row in limited_results:
        status_map[row[0]] = {
            "count": int(row[1]),
            "onlineCount": int(row[2]),
            "offlineCount": int(row[3]),
        }

    pipeline = []
    total_active = 0
    total_completed = 0
    total_cancelled = 0

    for s in status_order:
        data = status_map.get(s, {"count": 0, "onlineCount": 0, "offlineCount": 0})
        pipeline.append(StatusCount(
            status=s.value,
            count=data["count"],
            onlineCount=data["onlineCount"],
            offlineCount=data["offlineCount"],
        ))
        if s in (OrderStatus.DELIVERED, OrderStatus.PICKED_UP):
            total_completed += data["count"]
        elif s == OrderStatus.CANCELLED:
            total_cancelled = data["count"]
        else:
            total_active += data["count"]

    return OrderPipelineResponse(
        pipeline=pipeline,
        totalActive=total_active,
        totalCompleted=total_completed,
        totalCancelled=total_cancelled,
    )


@router.get("/sales-channel-comparison", response_model=SalesChannelComparisonResponse)
def get_sales_channel_comparison(
    months: int = Query(3, ge=1, le=12, description="Number of months to include"),
    db: Session = Depends(get_db),
    _current_employee=Depends(require_staff),
):
    """Compare online vs offline sales channels over time."""
    now = get_current_time()

    start_year = now.year
    start_month = now.month - months + 1
    while start_month <= 0:
        start_month += 12
        start_year -= 1
    start_date = datetime(start_year, start_month, 1)

    base_filters = [
        Order.status != OrderStatus.CANCELLED,
        Order.created_at >= start_date,
    ]

    # Per channel totals
    channel_results = (
        db.query(
            Order.sales_channel,
            func.coalesce(func.sum(Order.paid_amount), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(*base_filters)
        .group_by(Order.sales_channel)
        .all()
    )

    channels = []
    for row in channel_results:
        channel_name = row[0].value if row[0] else "online"
        revenue = float(row[1])
        orders = int(row[2])
        avg_order = revenue / orders if orders > 0 else 0.0
        channels.append(ChannelStats(
            channel=channel_name,
            revenue=revenue,
            orders=orders,
            avgOrderValue=round(avg_order, 2),
        ))

    # Ensure both channels are present
    channel_names = {c.channel for c in channels}
    for ch in ["online", "offline"]:
        if ch not in channel_names:
            channels.append(ChannelStats(channel=ch, revenue=0, orders=0, avgOrderValue=0))

    # Monthly breakdown
    monthly_breakdown = []
    current_date = start_date
    while current_date <= now:
        year = current_date.year
        month = current_date.month
        month_name = f"{calendar.month_name[month]} {year}"
        last_day = calendar.monthrange(year, month)[1]
        month_start = datetime(year, month, 1)
        month_end = datetime(year, month, last_day, 23, 59, 59)

        month_channel = (
            db.query(
                Order.sales_channel,
                func.coalesce(func.sum(Order.paid_amount), 0).label("revenue"),
                func.count(Order.id).label("orders"),
            )
            .filter(
                Order.status != OrderStatus.CANCELLED,
                Order.created_at >= month_start,
                Order.created_at <= month_end,
            )
            .group_by(Order.sales_channel)
            .all()
        )

        data = {"online": {"revenue": 0.0, "orders": 0}, "offline": {"revenue": 0.0, "orders": 0}}
        for row in month_channel:
            ch = row[0].value if row[0] else "online"
            data[ch] = {"revenue": float(row[1]), "orders": int(row[2])}

        monthly_breakdown.append(MonthlyChannelData(
            month=month_name,
            onlineRevenue=data["online"]["revenue"],
            offlineRevenue=data["offline"]["revenue"],
            onlineOrders=data["online"]["orders"],
            offlineOrders=data["offline"]["orders"],
        ))

        if month == 12:
            current_date = datetime(year + 1, 1, 1)
        else:
            current_date = datetime(year, month + 1, 1)

    return SalesChannelComparisonResponse(
        channels=channels,
        monthlyBreakdown=monthly_breakdown,
    )
