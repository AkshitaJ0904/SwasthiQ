from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
import random
import string
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models.models import Sale, SaleItem, Medicine
from schemas.schemas import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["Sales"])


def generate_invoice():
    year = datetime.now().year
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"INV-{year}-{suffix}"


@router.get("")
def list_sales(limit: int = 50, db: Session = Depends(get_db)):
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
            "created_at": sale.created_at.isoformat() if sale.created_at else None,
            "items": [
                {"medicine_id": item.medicine_id, "quantity": item.quantity, "price": item.price}
                for item in sale.items
            ]
        })
    return result


@router.post("", status_code=201)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    total_amount = sum(item.price * item.quantity for item in sale.items)
    invoice = generate_invoice()

    db_sale = Sale(
        invoice_number=invoice,
        patient_name=sale.patient_name,
        patient_id=sale.patient_id,
        total_amount=total_amount,
        payment_method=sale.payment_method,
        status="COMPLETED"
    )
    db.add(db_sale)
    db.flush()

    for item in sale.items:
        medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine {item.medicine_id} not found")
        if medicine.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {medicine.name}")

        medicine.quantity -= item.quantity

        db_item = SaleItem(
            sale_id=db_sale.id,
            medicine_id=item.medicine_id,
            quantity=item.quantity,
            price=item.price
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_sale)
    return {"id": db_sale.id, "invoice_number": db_sale.invoice_number, "total_amount": db_sale.total_amount}


@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "patient_name": sale.patient_name,
        "total_amount": sale.total_amount,
        "payment_method": sale.payment_method,
        "status": sale.status,
        "created_at": sale.created_at.isoformat() if sale.created_at else None,
        "items": [
            {"medicine_id": i.medicine_id, "quantity": i.quantity, "price": i.price}
            for i in sale.items
        ]
    }
