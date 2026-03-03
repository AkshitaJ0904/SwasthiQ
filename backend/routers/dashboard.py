from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models.models import Medicine, Sale, SaleItem, PurchaseOrder
from schemas.schemas import DashboardSummary, InventoryOverview

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def compute_medicine_status(medicine, today):
    if medicine.quantity == 0:
        return "OUT_OF_STOCK"
    if medicine.expiry_date < today:
        return "EXPIRED"
    if medicine.quantity < 20:
        return "LOW_STOCK"
    return "ACTIVE"


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    today_sales_result = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= today_start,
        Sale.created_at <= today_end,
        Sale.status == "COMPLETED"
    ).scalar() or 0

    yesterday_start = datetime.combine(today - timedelta(days=1), datetime.min.time())
    yesterday_end = datetime.combine(today - timedelta(days=1), datetime.max.time())
    yesterday_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= yesterday_start,
        Sale.created_at <= yesterday_end,
        Sale.status == "COMPLETED"
    ).scalar() or 0  # ← change to 0, not 1

    # Fix growth logic
    if yesterday_sales == 0 and today_sales_result == 0:
        growth = 0.0          # both zero → no change
    elif yesterday_sales == 0:
        growth = 100.0        # new sales today, nothing yesterday → show +100%
    else:
        growth = ((today_sales_result - yesterday_sales) / yesterday_sales) * 100
    items_sold = db.query(func.sum(SaleItem.quantity)).join(Sale).filter(
        Sale.created_at >= today_start,
        Sale.created_at <= today_end,
        Sale.status == "COMPLETED"
    ).scalar() or 0

    total_orders = db.query(func.count(Sale.id)).filter(
        Sale.created_at >= today_start,
        Sale.created_at <= today_end
    ).scalar() or 0

    medicines = db.query(Medicine).all()
    low_stock_count = sum(1 for m in medicines if compute_medicine_status(m, today) in ("LOW_STOCK", "OUT_OF_STOCK"))

    po_total = db.query(func.sum(PurchaseOrder.total_cost)).filter(
        PurchaseOrder.status == "PENDING"
    ).scalar() or 0

    pending_po = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.status == "PENDING"
    ).scalar() or 0

    return DashboardSummary(
        today_sales=today_sales_result,
        sales_growth=round(growth, 1),
        items_sold_today=int(items_sold),
        total_orders=int(total_orders),
        low_stock_count=low_stock_count,
        purchase_order_total=po_total,
        pending_po_count=int(pending_po)
    )


@router.get("/inventory-overview", response_model=InventoryOverview)
def get_inventory_overview(db: Session = Depends(get_db)):
    today = date.today()
    medicines = db.query(Medicine).all()

    total_items = len(medicines)
    active_stock = sum(1 for m in medicines if compute_medicine_status(m, today) == "ACTIVE")
    low_stock = sum(1 for m in medicines if compute_medicine_status(m, today) == "LOW_STOCK")
    total_value = sum(m.mrp * m.quantity for m in medicines)

    return InventoryOverview(
        total_items=total_items,
        active_stock=active_stock,
        low_stock=low_stock,
        total_value=total_value
    )


@router.get("/recent-sales")
def get_recent_sales(limit: int = 10, db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(limit).all()
    result = []
    for sale in sales:
        result.append({
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "patient_name": sale.patient_name,
            "patient_id": sale.patient_id,
            "total_amount": sale.total_amount,
            "payment_method": sale.payment_method,
            "status": sale.status,
            "item_count": len(sale.items),
            "created_at": sale.created_at.isoformat() if sale.created_at else None
        })
    return result


@router.get("/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):
    today = date.today()
    medicines = db.query(Medicine).all()
    low_stock_items = [
        {
            "id": m.id,
            "name": m.name,
            "quantity": m.quantity,
            "status": compute_medicine_status(m, today),
            "supplier": m.supplier
        }
        for m in medicines
        if compute_medicine_status(m, today) in ("LOW_STOCK", "OUT_OF_STOCK")
    ]
    return low_stock_items
