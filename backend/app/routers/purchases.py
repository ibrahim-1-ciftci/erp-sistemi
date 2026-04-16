from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission, check_permission, log_activity
from app.models.purchase import Purchase, PurchaseStatus
from app.models.raw_material import RawMaterial
from app.models.stock_movement import StockMovement, MovementType
from app.models.user import User

router = APIRouter(prefix="/purchases", tags=["purchases"])

class PurchaseCreate(BaseModel):
    material_id:   int
    supplier_id:   Optional[int] = None
    quantity:      float
    unit_price:    float
    expected_date: Optional[date] = None
    notes:         Optional[str] = None

class PurchaseUpdate(BaseModel):
    quantity:      Optional[float] = None
    unit_price:    Optional[float] = None
    expected_date: Optional[date] = None
    notes:         Optional[str] = None

def build(p: Purchase) -> dict:
    return {
        "id": p.id,
        "material_id": p.material_id,
        "material_name": p.material.name if p.material else None,
        "material_unit": p.material.unit if p.material else None,
        "supplier_id": p.supplier_id,
        "supplier_name": p.supplier.name if p.supplier else None,
        "quantity": p.quantity,
        "unit_price": p.unit_price,
        "total_cost": p.total_cost,
        "status": p.status,
        "expected_date": p.expected_date,
        "received_date": p.received_date,
        "notes": p.notes,
        "created_at": p.created_at,
    }

@router.get("")
def list_purchases(status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(check_permission("purchases", "view"))):
    query = db.query(Purchase).order_by(Purchase.created_at.desc())
    if status:
        query = query.filter(Purchase.status == status)
    items = query.all()
    total_pending_cost = sum(p.total_cost for p in items if p.status == PurchaseStatus.pending)
    return {"items": [build(p) for p in items], "total_pending_cost": total_pending_cost}

@router.post("")
def create_purchase(data: PurchaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mat = db.query(RawMaterial).filter(RawMaterial.id == data.material_id).first()
    if not mat: raise HTTPException(404, "Hammadde bulunamadı")
    p = Purchase(
        material_id=data.material_id,
        supplier_id=data.supplier_id or (mat.supplier_id),
        quantity=data.quantity,
        unit_price=data.unit_price,
        total_cost=data.quantity * data.unit_price,
        expected_date=data.expected_date,
        notes=data.notes,
    )
    db.add(p); db.commit(); db.refresh(p)
    log_activity(db, current_user.id, "CREATE", "Purchase", p.id, f"Satın alma: {mat.name} x{data.quantity}")
    return build(p)

@router.post("/{purchase_id}/receive")
def receive_purchase(purchase_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Malzeme teslim alındı — stoka ekle, kasaya gider yaz"""
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p: raise HTTPException(404, "Kayıt bulunamadı")
    if p.status == PurchaseStatus.received: raise HTTPException(400, "Zaten teslim alındı")

    mat = db.query(RawMaterial).filter(RawMaterial.id == p.material_id).first()
    mat.stock_quantity += p.quantity
    mv = StockMovement(material_id=mat.id, type=MovementType.in_, quantity=p.quantity,
                       description=f"Satın alma #{p.id} teslim alındı")
    db.add(mv)

    # Kasaya gider kaydı
    from app.models.cashflow import CashFlow
    cf = CashFlow(
        flow_date=date.today(),
        flow_type="expense",
        amount=p.total_cost,
        description=f"Satın alma: {mat.name} x{p.quantity} {mat.unit}",
        category="Hammadde Alımı",
    )
    db.add(cf)

    p.status = PurchaseStatus.received
    p.received_date = date.today()
    db.commit()
    log_activity(db, current_user.id, "RECEIVE", "Purchase", purchase_id, f"{mat.name} +{p.quantity} stoka eklendi")
    return build(p)

@router.put("/{purchase_id}")
def update_purchase(purchase_id: int, data: PurchaseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p: raise HTTPException(404, "Kayıt bulunamadı")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    if data.quantity or data.unit_price:
        p.total_cost = p.quantity * p.unit_price
    db.commit(); db.refresh(p)
    return build(p)

@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p: raise HTTPException(404, "Kayıt bulunamadı")
    if p.status == PurchaseStatus.received: raise HTTPException(400, "Teslim alınan sipariş silinemez")
    db.delete(p); db.commit()
    return {"message": "Silindi"}

@router.get("/suggestions")
def purchase_suggestions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Kritik stok altındaki hammaddeler için satın alma önerisi"""
    from app.models.raw_material import RawMaterial
    materials = db.query(RawMaterial).all()
    suggestions = []
    for m in materials:
        if m.stock_quantity < m.min_stock_level:
            shortage = m.min_stock_level - m.stock_quantity
            suggested_qty = shortage * 2  # 2x buffer
            suggestions.append({
                "material_id": m.id,
                "material_name": m.name,
                "unit": m.unit,
                "current_stock": m.stock_quantity,
                "min_stock": m.min_stock_level,
                "shortage": shortage,
                "suggested_quantity": suggested_qty,
                "estimated_cost": suggested_qty * m.purchase_price,
                "supplier_id": m.supplier_id,
                "supplier_name": m.supplier.name if m.supplier else None,
            })
    return suggestions
