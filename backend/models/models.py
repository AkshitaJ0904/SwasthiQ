from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class MedicineStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    LOW_STOCK = "LOW_STOCK"
    EXPIRED = "EXPIRED"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class SaleStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"


class POStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    generic_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    batch_no = Column(String(100), nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    cost_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    supplier = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sale_items = relationship("SaleItem", back_populates="medicine")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    patient_name = Column(String(255), nullable=False)
    patient_id = Column(String(100))
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False, default="Cash")
    status = Column(String(20), nullable=False, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    medicine = relationship("Medicine", back_populates="sale_items")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False)
    supplier = Column(String(255), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expected_delivery = Column(Date)
