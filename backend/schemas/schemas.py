from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class MedicineStatus(str, Enum):
    ACTIVE = "ACTIVE"
    LOW_STOCK = "LOW_STOCK"
    EXPIRED = "EXPIRED"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class SaleStatus(str, Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"


class POStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


# Medicine Schemas
class MedicineBase(BaseModel):
    name: str
    generic_name: str
    category: str
    batch_no: str
    expiry_date: date
    quantity: int
    cost_price: float
    mrp: float
    supplier: str


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[date] = None
    quantity: Optional[int] = None
    cost_price: Optional[float] = None
    mrp: Optional[float] = None
    supplier: Optional[str] = None


class MedicinePatch(BaseModel):
    status: MedicineStatus


class MedicineResponse(MedicineBase):
    id: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    predicted_days_to_low_stock: Optional[int] = None
    expiring_soon: Optional[bool] = None

    class Config:
        from_attributes = True


# Sale Schemas
class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int
    price: float


class SaleCreate(BaseModel):
    patient_name: str
    patient_id: Optional[str] = None
    payment_method: str = "Cash"
    items: List[SaleItemCreate]


class SaleItemResponse(BaseModel):
    id: int
    medicine_id: int
    quantity: int
    price: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    patient_name: str
    patient_id: Optional[str] = None
    total_amount: float
    payment_method: str
    status: str
    created_at: Optional[datetime] = None
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True


# Purchase Order Schemas
class PurchaseOrderCreate(BaseModel):
    supplier: str
    medicine_name: str
    quantity: int
    unit_cost: float
    expected_delivery: Optional[date] = None


class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier: str
    medicine_name: str
    quantity: int
    unit_cost: float
    total_cost: float
    status: str
    created_at: Optional[datetime] = None
    expected_delivery: Optional[date] = None

    class Config:
        from_attributes = True


# Dashboard Schemas
class DashboardSummary(BaseModel):
    today_sales: float
    sales_growth: float
    items_sold_today: int
    total_orders: int
    low_stock_count: int
    purchase_order_total: float
    pending_po_count: int


class InventoryOverview(BaseModel):
    total_items: int
    active_stock: int
    low_stock: int
    total_value: float


class PaginatedMedicines(BaseModel):
    items: List[MedicineResponse]
    total: int
    page: int
    size: int
    pages: int
