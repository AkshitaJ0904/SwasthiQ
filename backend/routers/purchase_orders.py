from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import random, string
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db
from models.models import PurchaseOrder
from schemas.schemas import PurchaseOrderCreate, PurchaseOrderResponse

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

VALID_PO_STATUSES = {"PENDING", "APPROVED", "RECEIVED", "CANCELLED"}

def generate_po():
    year = datetime.now().year
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"PO-{year}-{suffix}"

@router.get("")
def list_purchase_orders(status: str = None, db: Session = Depends(get_db)):
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status.upper())
    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    return orders

@router.post("", status_code=201)
def create_purchase_order(order: PurchaseOrderCreate, db: Session = Depends(get_db)):
    total_cost = order.quantity * order.unit_cost
    db_order = PurchaseOrder(
        po_number=generate_po(),
        supplier=order.supplier,
        medicine_name=order.medicine_name,
        quantity=order.quantity,
        unit_cost=order.unit_cost,
        total_cost=total_cost,
        status="PENDING",
        expected_delivery=order.expected_delivery
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.patch("/{order_id}/status")
def update_po_status(order_id: int, status: str, db: Session = Depends(get_db)):
    status_upper = status.upper()
    if status_upper not in VALID_PO_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{status}'. Must be one of: {', '.join(VALID_PO_STATUSES)}"
        )
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    order.status = status_upper
    db.commit()
    db.refresh(order)
    return order