from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import date, timedelta
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models.models import Medicine
from schemas.schemas import MedicineCreate, MedicineUpdate, MedicinePatch, MedicineResponse, PaginatedMedicines

router = APIRouter(prefix="/medicines", tags=["Medicines"])


def compute_status(medicine):
    today = date.today()
    if medicine.quantity == 0:
        return "OUT_OF_STOCK"
    if medicine.expiry_date < today:
        return "EXPIRED"
    if medicine.quantity < 20:
        return "LOW_STOCK"
    return "ACTIVE"


def compute_predicted_days(medicine):
    """Simple linear prediction: rough estimate based on stock level"""
    if medicine.quantity <= 0:
        return 0
    # Assume daily consumption ~5 units (configurable)
    daily_consumption = 5
    return max(0, medicine.quantity // daily_consumption)


def enrich_medicine(m):
    today = date.today()
    expiry_soon = (m.expiry_date - today).days < 60 if m.expiry_date > today else False
    return {
        "id": m.id,
        "name": m.name,
        "generic_name": m.generic_name,
        "category": m.category,
        "batch_no": m.batch_no,
        "expiry_date": m.expiry_date,
        "quantity": m.quantity,
        "cost_price": m.cost_price,
        "mrp": m.mrp,
        "supplier": m.supplier,
        "status": compute_status(m),
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "predicted_days_to_low_stock": compute_predicted_days(m),
        "expiring_soon": expiry_soon
    }


@router.get("", response_model=PaginatedMedicines)
def list_medicines(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    supplier: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)

    if search:
        query = query.filter(
            or_(
                Medicine.name.ilike(f"%{search}%"),
                Medicine.generic_name.ilike(f"%{search}%")
            )
        )

    if category:
        query = query.filter(Medicine.category.ilike(f"%{category}%"))

    if supplier:
        query = query.filter(Medicine.supplier.ilike(f"%{supplier}%"))

    all_medicines = query.all()

    # Apply status filter after computing dynamic status
    if status:
        all_medicines = [m for m in all_medicines if compute_status(m) == status.upper()]

    total = len(all_medicines)
    start = (page - 1) * size
    end = start + size
    paginated = all_medicines[start:end]

    return PaginatedMedicines(
        items=[enrich_medicine(m) for m in paginated],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size
    )


@router.get("/all")
def get_all_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).all()
    return [enrich_medicine(m) for m in medicines]


@router.get("/{medicine_id}")
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return enrich_medicine(medicine)


@router.post("", status_code=201)
def create_medicine(medicine: MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = Medicine(**medicine.dict())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return enrich_medicine(db_medicine)


@router.put("/{medicine_id}")
def update_medicine(medicine_id: int, medicine: MedicineUpdate, db: Session = Depends(get_db)):
    db_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    update_data = medicine.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_medicine, key, value)

    db.commit()
    db.refresh(db_medicine)
    return enrich_medicine(db_medicine)


@router.patch("/{medicine_id}/status")
def patch_medicine_status(medicine_id: int, patch: MedicinePatch, db: Session = Depends(get_db)):
    db_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    if patch.status == "EXPIRED":
        db_medicine.expiry_date = date.today() - timedelta(days=1)
    elif patch.status == "OUT_OF_STOCK":
        db_medicine.quantity = 0

    db.commit()
    db.refresh(db_medicine)
    return enrich_medicine(db_medicine)


@router.delete("/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    db_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(db_medicine)
    db.commit()
    return None
