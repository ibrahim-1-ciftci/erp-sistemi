from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission, log_activity
from app.models.raw_material import RawMaterial
from app.models.stock_movement import StockMovement, MovementType
from app.models.user import User
from app.schemas.raw_material import RawMaterialCreate, RawMaterialUpdate, RawMaterialOut, StockAdjust

router = APIRouter(prefix="/raw-materials", tags=["raw-materials"])

def enrich(m: RawMaterial) -> dict:
    data = RawMaterialOut.model_validate(m).model_dump()
    data["is_low_stock"] = m.stock_quantity < m.min_stock_level
    data["supplier_name"] = m.supplier.name if m.supplier else None
    return data

@router.get("", response_model=dict)
def list_materials(
    skip: int = 0, limit: int = 20,
    search: Optional[str] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("raw_materials", "view"))
):
    query = db.query(RawMaterial)
    if search:
        query = query.filter(RawMaterial.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(RawMaterial.name).offset(skip).limit(limit).all()
    result = [enrich(m) for m in items]
    if low_stock:
        result = [r for r in result if r["is_low_stock"]]
    return {"total": total, "items": result}

@router.post("", response_model=dict)
def create_material(data: RawMaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(check_permission("raw_materials", "create"))):
    material = RawMaterial(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    if material.stock_quantity > 0:
        mv = StockMovement(material_id=material.id, type=MovementType.in_, quantity=material.stock_quantity, description="İlk stok girişi")
        db.add(mv)
        db.commit()
    log_activity(db, current_user.id, "CREATE", "RawMaterial", material.id, f"Hammadde oluşturuldu: {material.name}")
    return enrich(material)

@router.get("/low-stock", response_model=list)
def get_low_stock(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = db.query(RawMaterial).all()
    return [enrich(m) for m in materials if m.stock_quantity < m.min_stock_level]

@router.get("/{material_id}", response_model=dict)
def get_material(material_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    return enrich(m)

@router.put("/{material_id}", response_model=dict)
def update_material(material_id: int, data: RawMaterialUpdate, db: Session = Depends(get_db), current_user: User = Depends(check_permission("raw_materials", "edit"))):
    m = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(m, key, value)
    db.commit()
    db.refresh(m)
    log_activity(db, current_user.id, "UPDATE", "RawMaterial", material_id)
    return enrich(m)

@router.post("/{material_id}/adjust-stock", response_model=dict)
def adjust_stock(material_id: int, data: StockAdjust, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    
    move_type = MovementType.in_ if data.quantity > 0 else MovementType.out
    m.stock_quantity += data.quantity
    if m.stock_quantity < 0:
        raise HTTPException(status_code=400, detail="Stok miktarı negatif olamaz")
    
    mv = StockMovement(material_id=material_id, type=move_type, quantity=abs(data.quantity), description=data.description or "Manuel stok düzeltme")
    db.add(mv)
    db.commit()
    db.refresh(m)
    log_activity(db, current_user.id, "STOCK_ADJUST", "RawMaterial", material_id,
                 f"{m.name}: {'+'if data.quantity>0 else ''}{data.quantity} {m.unit} — {data.description or 'Manuel düzeltme'}")
    return enrich(m)

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_permission("raw_materials", "delete"))):
    from app.models.bom import BOMItem
    m = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")

    # Bağlı BOM kalemlerini kontrol et
    bom_usage = db.query(BOMItem).filter(BOMItem.raw_material_id == material_id).count()
    if bom_usage > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Bu hammadde {bom_usage} reçetede kullanılıyor. Önce ilgili reçeteleri güncelleyin."
        )

    # Stok hareketlerini temizle
    db.query(StockMovement).filter(StockMovement.material_id == material_id).delete()
    db.delete(m)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "RawMaterial", material_id)
    return {"message": "Hammadde silindi"}
