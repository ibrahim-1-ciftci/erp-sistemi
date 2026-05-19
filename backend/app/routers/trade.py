from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.core.deps import get_current_user, log_activity
from app.models.trade import TradeItem, TradePurchase, TradeSale
from app.models.user import User

router = APIRouter(prefix="/trade", tags=["trade"])


# ── Pydantic Schemas ──────────────────────────────────────────

class TradeItemCreate(BaseModel):
    name: str
    unit: str = "adet"
    notes: Optional[str] = None

class TradeItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None

class TradePurchaseCreate(BaseModel):
    trade_item_id: int
    supplier: str
    quantity: float
    unit_price: float
    purchase_date: date
    notes: Optional[str] = None

class TradeSaleCreate(BaseModel):
    trade_item_id: int
    customer: str
    quantity: float
    unit_price: float
    commission_rate: float = 0
    sale_date: date
    notes: Optional[str] = None


# ── Yardımcı ──────────────────────────────────────────────────

def item_dict(item: TradeItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "unit": item.unit,
        "stock": item.stock,
        "notes": item.notes,
        "created_at": item.created_at,
    }

def purchase_dict(p: TradePurchase, item_name: str = None) -> dict:
    return {
        "id": p.id,
        "trade_item_id": p.trade_item_id,
        "item_name": item_name,
        "supplier": p.supplier,
        "quantity": p.quantity,
        "unit_price": p.unit_price,
        "total_cost": p.total_cost,
        "purchase_date": p.purchase_date,
        "notes": p.notes,
        "created_at": p.created_at,
    }

def sale_dict(s: TradeSale, item_name: str = None) -> dict:
    return {
        "id": s.id,
        "trade_item_id": s.trade_item_id,
        "item_name": item_name,
        "customer": s.customer,
        "quantity": s.quantity,
        "unit_price": s.unit_price,
        "total_revenue": s.total_revenue,
        "commission_rate": s.commission_rate,
        "commission_amount": s.commission_amount,
        "sale_date": s.sale_date,
        "notes": s.notes,
        "created_at": s.created_at,
    }


# ── Stok Kalemleri ────────────────────────────────────────────

@router.get("/items")
def list_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(TradeItem).order_by(TradeItem.name).all()
    return [item_dict(i) for i in items]

@router.post("/items")
def create_item(data: TradeItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = TradeItem(**data.dict())
    db.add(item); db.commit(); db.refresh(item)
    log_activity(db, current_user.id, "CREATE", "TradeItem", item.id, f"Ticaret kalemi: {item.name}")
    return item_dict(item)

@router.put("/items/{item_id}")
def update_item(item_id: int, data: TradeItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(TradeItem).filter(TradeItem.id == item_id).first()
    if not item: raise HTTPException(404, "Kalem bulunamadı")
    for k, v in data.dict(exclude_none=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return item_dict(item)

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(TradeItem).filter(TradeItem.id == item_id).first()
    if not item: raise HTTPException(404, "Kalem bulunamadı")
    db.delete(item); db.commit()
    return {"message": "Silindi"}


# ── Alışlar ───────────────────────────────────────────────────

@router.get("/purchases")
def list_purchases(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(TradePurchase)
    if year:  q = q.filter(extract('year',  TradePurchase.purchase_date) == year)
    if month: q = q.filter(extract('month', TradePurchase.purchase_date) == month)
    purchases = q.order_by(TradePurchase.purchase_date.desc()).all()
    items_map = {i.id: i.name for i in db.query(TradeItem).all()}
    return [purchase_dict(p, items_map.get(p.trade_item_id)) for p in purchases]

@router.post("/purchases")
def create_purchase(data: TradePurchaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(TradeItem).filter(TradeItem.id == data.trade_item_id).first()
    if not item: raise HTTPException(404, "Kalem bulunamadı")
    total = data.quantity * data.unit_price
    p = TradePurchase(
        trade_item_id=data.trade_item_id,
        supplier=data.supplier,
        quantity=data.quantity,
        unit_price=data.unit_price,
        total_cost=total,
        purchase_date=data.purchase_date,
        notes=data.notes,
    )
    db.add(p)
    item.stock += data.quantity   # stok artar
    db.commit(); db.refresh(p)
    log_activity(db, current_user.id, "CREATE", "TradePurchase", p.id, f"Alış: {item.name} x{data.quantity}")
    return purchase_dict(p, item.name)

@router.delete("/purchases/{pid}")
def delete_purchase(pid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(TradePurchase).filter(TradePurchase.id == pid).first()
    if not p: raise HTTPException(404, "Kayıt bulunamadı")
    item = db.query(TradeItem).filter(TradeItem.id == p.trade_item_id).first()
    if item: item.stock = max(0, item.stock - p.quantity)
    db.delete(p); db.commit()
    return {"message": "Silindi"}


# ── Satışlar ──────────────────────────────────────────────────

@router.get("/sales")
def list_sales(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(TradeSale)
    if year:  q = q.filter(extract('year',  TradeSale.sale_date) == year)
    if month: q = q.filter(extract('month', TradeSale.sale_date) == month)
    sales = q.order_by(TradeSale.sale_date.desc()).all()
    items_map = {i.id: i.name for i in db.query(TradeItem).all()}
    return [sale_dict(s, items_map.get(s.trade_item_id)) for s in sales]

@router.post("/sales")
def create_sale(data: TradeSaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(TradeItem).filter(TradeItem.id == data.trade_item_id).first()
    if not item: raise HTTPException(404, "Kalem bulunamadı")
    if item.stock < data.quantity:
        raise HTTPException(400, f"Yetersiz stok. Mevcut: {item.stock} {item.unit}")
    total = data.quantity * data.unit_price
    commission = round(total * data.commission_rate / 100, 2)
    s = TradeSale(
        trade_item_id=data.trade_item_id,
        customer=data.customer,
        quantity=data.quantity,
        unit_price=data.unit_price,
        total_revenue=total,
        commission_rate=data.commission_rate,
        commission_amount=commission,
        sale_date=data.sale_date,
        notes=data.notes,
    )
    db.add(s)
    item.stock -= data.quantity   # stok düşer
    db.commit(); db.refresh(s)
    log_activity(db, current_user.id, "CREATE", "TradeSale", s.id, f"Satış: {item.name} x{data.quantity} %{data.commission_rate} komisyon")
    return sale_dict(s, item.name)

@router.delete("/sales/{sid}")
def delete_sale(sid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(TradeSale).filter(TradeSale.id == sid).first()
    if not s: raise HTTPException(404, "Kayıt bulunamadı")
    item = db.query(TradeItem).filter(TradeItem.id == s.trade_item_id).first()
    if item: item.stock += s.quantity   # stok geri gelir
    db.delete(s); db.commit()
    return {"message": "Silindi"}


# ── Özet ──────────────────────────────────────────────────────

@router.get("/summary")
def summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import date as dt_date
    y = year or dt_date.today().year
    m = month or dt_date.today().month

    purchases = db.query(TradePurchase).filter(
        extract('year', TradePurchase.purchase_date) == y,
        extract('month', TradePurchase.purchase_date) == m
    ).all()
    sales = db.query(TradeSale).filter(
        extract('year', TradeSale.sale_date) == y,
        extract('month', TradeSale.sale_date) == m
    ).all()

    total_cost     = sum(p.total_cost for p in purchases)
    total_revenue  = sum(s.total_revenue for s in sales)
    total_commission = sum(s.commission_amount for s in sales)
    net_profit     = total_revenue - total_cost

    return {
        "year": y, "month": m,
        "total_cost": round(total_cost, 2),
        "total_revenue": round(total_revenue, 2),
        "total_commission": round(total_commission, 2),
        "net_profit": round(net_profit, 2),
        "purchase_count": len(purchases),
        "sale_count": len(sales),
    }
