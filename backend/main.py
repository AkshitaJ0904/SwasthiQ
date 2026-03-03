from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from routers import dashboard, medicines, sales, purchase_orders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SwasthiQ Pharmacy API",
    description="Pharmacy module backend for SwasthiQ EMR",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(medicines.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(purchase_orders.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "SwasthiQ Pharmacy API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
