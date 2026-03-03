import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models.models import Medicine, Sale, SaleItem, PurchaseOrder
from datetime import date, datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Clear existing
        db.query(SaleItem).delete()
        db.query(Sale).delete()
        db.query(PurchaseOrder).delete()
        db.query(Medicine).delete()
        db.commit()

        medicines = [
            Medicine(name="Paracetamol 650mg", generic_name="Acetaminophen", category="Analgesic",
                     batch_no="PCM-2024-0892", expiry_date=date(2026, 8, 20), quantity=500,
                     cost_price=15.0, mrp=25.0, supplier="MedSupply Co."),
            Medicine(name="Omeprazole 20mg Capsule", generic_name="Omeprazole", category="Gastric",
                     batch_no="OMP-2024-5873", expiry_date=date(2025, 11, 10), quantity=45,
                     cost_price=65.0, mrp=95.75, supplier="HealthCare Ltd."),
            Medicine(name="Aspirin 75mg", generic_name="Aspirin", category="Anticoagulant",
                     batch_no="ASP-2023-3401", expiry_date=date(2024, 9, 30), quantity=300,
                     cost_price=28.0, mrp=45.0, supplier="GreenMed"),
            Medicine(name="Atorvastatin 10mg", generic_name="Atorvastatin Besylate", category="Cardiovascular",
                     batch_no="AME-2024-0945", expiry_date=date(2025, 10, 15), quantity=0,
                     cost_price=145.0, mrp=195.0, supplier="PharmaCorp"),
            Medicine(name="Metformin 500mg", generic_name="Metformin HCl", category="Antidiabetic",
                     batch_no="MET-2024-1122", expiry_date=date(2026, 6, 30), quantity=250,
                     cost_price=12.0, mrp=20.0, supplier="MedSupply Co."),
            Medicine(name="Amlodipine 5mg", generic_name="Amlodipine Besylate", category="Antihypertensive",
                     batch_no="AML-2024-3310", expiry_date=date(2026, 3, 15), quantity=180,
                     cost_price=22.0, mrp=38.0, supplier="HealthCare Ltd."),
            Medicine(name="Cetirizine 10mg", generic_name="Cetirizine HCl", category="Antihistamine",
                     batch_no="CET-2024-7721", expiry_date=date(2025, 12, 31), quantity=12,
                     cost_price=8.0, mrp=15.0, supplier="GreenMed"),
            Medicine(name="Pantoprazole 40mg", generic_name="Pantoprazole Sodium", category="Gastric",
                     batch_no="PAN-2024-4490", expiry_date=date(2026, 9, 30), quantity=320,
                     cost_price=55.0, mrp=85.0, supplier="PharmaCorp"),
            Medicine(name="Azithromycin 500mg", generic_name="Azithromycin", category="Antibiotic",
                     batch_no="AZI-2024-8823", expiry_date=date(2025, 7, 20), quantity=8,
                     cost_price=95.0, mrp=145.0, supplier="MedSupply Co."),
            Medicine(name="Losartan 50mg", generic_name="Losartan Potassium", category="Antihypertensive",
                     batch_no="LOS-2024-5567", expiry_date=date(2026, 11, 30), quantity=150,
                     cost_price=42.0, mrp=68.0, supplier="HealthCare Ltd."),
        ]

        db.add_all(medicines)
        db.commit()

        # Add sales
        sales_data = [
            {"invoice_number": "INV-2024-1234", "patient_name": "Rajesh Kumar",
             "patient_id": "P001", "total_amount": 340.0, "payment_method": "Card",
             "status": "COMPLETED",
             "created_at": datetime.now() - timedelta(hours=2)},
            {"invoice_number": "INV-2024-1235", "patient_name": "Sarah Smith",
             "patient_id": "P002", "total_amount": 145.0, "payment_method": "Cash",
             "status": "COMPLETED",
             "created_at": datetime.now() - timedelta(hours=3)},
            {"invoice_number": "INV-2024-1236", "patient_name": "Michael Johnson",
             "patient_id": "P003", "total_amount": 625.0, "payment_method": "UPI",
             "status": "COMPLETED",
             "created_at": datetime.now() - timedelta(hours=5)},
            {"invoice_number": "INV-2024-1237", "patient_name": "Priya Sharma",
             "patient_id": "P004", "total_amount": 89.0, "payment_method": "Cash",
             "status": "COMPLETED",
             "created_at": datetime.now() - timedelta(hours=6)},
            {"invoice_number": "INV-2024-1238", "patient_name": "Amit Patel",
             "patient_id": "P005", "total_amount": 325.75, "payment_method": "UPI",
             "status": "COMPLETED",
             "created_at": datetime.now() - timedelta(hours=8)},
        ]

        for s_data in sales_data:
            sale = Sale(**s_data)
            db.add(sale)
        db.commit()

        # Add sale items
        sales_list = db.query(Sale).all()
        meds_list = db.query(Medicine).all()
        for sale in sales_list:
            num_items = random.randint(1, 3)
            for _ in range(num_items):
                med = random.choice(meds_list)
                item = SaleItem(sale_id=sale.id, medicine_id=med.id,
                                quantity=random.randint(1, 5), price=med.mrp)
                db.add(item)
        db.commit()

        # Update sale item counts
        for sale in sales_list:
            pass  # item counts already set

        # Purchase Orders
        pos = [
            PurchaseOrder(po_number="PO-2024-0001", supplier="MedSupply Co.",
                         medicine_name="Paracetamol 650mg", quantity=500,
                         unit_cost=15.0, total_cost=7500.0, status="PENDING",
                         expected_delivery=date.today() + timedelta(days=7)),
            PurchaseOrder(po_number="PO-2024-0002", supplier="HealthCare Ltd.",
                         medicine_name="Omeprazole 20mg Capsule", quantity=200,
                         unit_cost=65.0, total_cost=13000.0, status="PENDING",
                         expected_delivery=date.today() + timedelta(days=5)),
            PurchaseOrder(po_number="PO-2024-0003", supplier="GreenMed",
                         medicine_name="Cetirizine 10mg", quantity=300,
                         unit_cost=8.0, total_cost=2400.0, status="PENDING",
                         expected_delivery=date.today() + timedelta(days=3)),
            PurchaseOrder(po_number="PO-2024-0004", supplier="PharmaCorp",
                         medicine_name="Atorvastatin 10mg", quantity=100,
                         unit_cost=145.0, total_cost=14500.0, status="PENDING",
                         expected_delivery=date.today() + timedelta(days=10)),
            PurchaseOrder(po_number="PO-2024-0005", supplier="MedSupply Co.",
                         medicine_name="Azithromycin 500mg", quantity=150,
                         unit_cost=95.0, total_cost=14250.0, status="PENDING",
                         expected_delivery=date.today() + timedelta(days=4)),
            PurchaseOrder(po_number="PO-2024-0006", supplier="HealthCare Ltd.",
                         medicine_name="Losartan 50mg", quantity=200,
                         unit_cost=42.0, total_cost=8400.0, status="APPROVED",
                         expected_delivery=date.today() + timedelta(days=2)),
        ]
        db.add_all(pos)
        db.commit()

        print("✅ Seed data inserted successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
