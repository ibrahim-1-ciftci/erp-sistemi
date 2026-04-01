from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
import app.models  # noqa: F401 - tüm modelleri yükle

from app.routers import auth, suppliers, raw_materials, products, bom, production, orders, reports, invoice, customers, payments, settings as settings_router, exports, debts, purchases

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERP Sistemi", version="1.0.0", description="Üretim ve İşletme Yönetim Sistemi")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://erp-sistemi-production.up.railway.app",
        "https://*.vercel.app",  # Vercel preview URL'leri
    ],
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

@app.get("/")
def root():
    return {"message": "ERP Sistemi API", "docs": "/docs"}
