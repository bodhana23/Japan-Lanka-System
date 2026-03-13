"""Pydantic schemas for financial analytics responses."""

from typing import List
from pydantic import BaseModel


class TopSellingPart(BaseModel):
    name: str
    units: int


class RevenueByCategory(BaseModel):
    category: str
    revenue: float


class DailyTrendEntry(BaseModel):
    date: str
    revenue: float


class MonthlySalesData(BaseModel):
    month: str
    sales: float
    orders: int
    topSellingParts: List[TopSellingPart]
    revenueByCategory: List[RevenueByCategory]
    dailyTrend: List[DailyTrendEntry]


class BrandSalesData(BaseModel):
    brand: str
    sales: float
    units: int


class FinancialSummaryResponse(BaseModel):
    salesData: List[MonthlySalesData]
    brandSales: List[BrandSalesData]
    monthlyRevenue: float
    yearlyRevenue: float


# ── Return Analytics Schemas ──

class MonthlyReturnData(BaseModel):
    month: str
    returns: int
    refundValue: float


class TopReturnedProduct(BaseModel):
    name: str
    returns: int


class ReturnReasonBreakdown(BaseModel):
    reason: str
    count: int


class ReturnAnalyticsResponse(BaseModel):
    returnRate: float
    totalReturns: int
    totalOrders: int
    monthlyReturns: List[MonthlyReturnData]
    topReturnedProducts: List[TopReturnedProduct]
    reasonBreakdown: List[ReturnReasonBreakdown]


# ── Order Pipeline Schemas ──

class StatusCount(BaseModel):
    status: str
    count: int
    onlineCount: int
    offlineCount: int


class OrderPipelineResponse(BaseModel):
    pipeline: List[StatusCount]
    totalActive: int
    totalCompleted: int
    totalCancelled: int


# ── Sales Channel Comparison Schemas ──

class ChannelStats(BaseModel):
    channel: str
    revenue: float
    orders: int
    avgOrderValue: float


class MonthlyChannelData(BaseModel):
    month: str
    onlineRevenue: float
    offlineRevenue: float
    onlineOrders: int
    offlineOrders: int


class SalesChannelComparisonResponse(BaseModel):
    channels: List[ChannelStats]
    monthlyBreakdown: List[MonthlyChannelData]
