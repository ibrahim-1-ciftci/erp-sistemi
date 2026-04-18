from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
import app.models  # noqa: F401 - tüm modelleri yükle

from app.routers import auth, suppliers, raw_materials, products, bom, production, orders, reports, invoice, customers, payments, settings as settings_router, exports, debts, purchases, cashflow as cashflow_router, employees as employees_router, delivery_note as delivery_note_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERP Sistemi", version="1.0.0", description="Üretim ve İşletme Yönetim Sistemi")

import os
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(raw_materials.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(bom.router, prefix="/api")
app.include_router(production.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(invoice.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(debts.router, prefix="/api")
app.include_router(purchases.router, prefix="/api")
app.include_router(cashflow_router.router, prefix="/api")
app.include_router(employees_router.router, prefix="/api")
app.include_router(delivery_note_router.router, prefix="/api")


# ── Otomatik log temizleme (15 günden eski kayıtlar) ──────────────────────
import asyncio
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.models.activity_log import ActivityLog
from app.models.stock_movement import StockMovement

async def auto_cleanup_task():
    """Her 24 saatte bir 15 günden eski log ve stok hareketi kayıtlarını siler."""
    while True:
        await asyncio.sleep(24 * 60 * 60)  # 24 saat bekle
        try:
            db = SessionLocal()
            cutoff = datetime.now(timezone.utc) - timedelta(days=15)
            deleted_logs = db.query(ActivityLog).filter(ActivityLog.created_at < cutoff).delete()
            deleted_mv   = db.query(StockMovement).filter(StockMovement.created_at < cutoff).delete()
            db.commit()
            db.close()
            print(f"[AutoCleanup] {deleted_logs} log, {deleted_mv} stok hareketi silindi.")
        except Exception as e:
            print(f"[AutoCleanup] Hata: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(auto_cleanup_task())


@app.get("/")
def root():
    return {"message": "ERP Sistemi API", "docs": "/docs"}
