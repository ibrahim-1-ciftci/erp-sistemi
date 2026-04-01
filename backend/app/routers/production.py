from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, log_activity
from app.models.bom import BOM
from app.models.product import Product
from app.models.raw_material import RawMaterial
from app.models.production import Production, ProductionStatus
from app.models.stock_movement import StockMovement, MovementType
from app.models.user import User
from app.schemas.production import ProductionCreate, ProductionOut

router = APIRouter(prefix="/production", tags=["production"])

def get_latest_bom(product_id: int, db: Session):
    return db.query(BOM).filter(BOM.product_id == product_id).order_by(BOM.version.desc()).first()

def calculate_cost(bom: BOM, quantity: float) -> tuple[float, list, list]:
    total_cost = 0
    materials_needed = []
    missing = []
    for item in bom.items:
        rm = item.raw_material
        needed = item.quantity_required * quantity
        cost = rm.purchase_price * needed
        total_cost += cost
        materials_needed.append({
            "material_id": rm.id,
            "name": rm.name,
            "unit": rm.unit,
            "needed": needed,
            "available": rm.stock_quantity,
            "sufficient": rm.stock_quantity >= needed,
            "cost": cost
        })
        if rm.stock_quantity < needed:
            missing.append({"name": rm.name, "needed": needed, "available": rm.stock_quantity, "shortage": needed - rm.stock_quantity})
    return total_cost, materials_needed, missing

@router.get("/preview")
def preview_production(product_id: int, quantity: float, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    bom = get_latest_bom(product_id, db)
    if not bom:
        raise HTTPException(status_code=404, detail="Bu ürün için reçete bulunamadı")
    
    total_cost, materials, missing = calculate_cost(bom, quantity)
    unit_cost = total_cost / quantity if quantity > 0 else 0
    profit_per_unit = product.sale_price - unit_cost
    
    return {
        "product_id": product_id,
        "product_name": product.name,
        "quantity": quantity,
        "total_cost": total_cost,
        "unit_cost": unit_cost,
        "sale_price": product.sale_price,
        "profit_per_unit": profit_per_unit,
        "total_profit": profit_per_unit * quantity,
        "materials": materials,
        "can_produce": len(missing) == 0,
        "missing_materials": missing
    }

@router.get("", response_model=dict)
def list_productions(
    skip: int = 0, limit: int = 20,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Production)
    if status:
        query = query.filter(Production.status == status)
    total = query.count()
    items = query.order_by(Production.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for p in items:
        d = ProductionOut.model_validate(p).model_dump()
        d["product_name"] = p.product.name if p.product else None
        result.append(d)
    return {"total": total, "items": result}

@router.post("", response_model=dict)
def create_production(data: ProductionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    bom = get_latest_bom(data.product_id, db)
    if not bom:
        raise HTTPException(status_code=404, detail="Bu ürün için reçete bulunamadı")
    
    total_cost, materials, missing = calculate_cost(bom, data.quantity)
    if missing:
        raise HTTPException(status_code=400, detail={"message": "Yetersiz stok", "missing_materials": missing})
    
    # Hammaddeleri düş
    for item in bom.items:
        rm = db.query(RawMaterial).filter(RawMaterial.id == item.raw_material_id).first()
        needed = item.quantity_required * data.quantity
        rm.stock_quantity -= needed
        mv = StockMovement(
            material_id=rm.id,
            type=MovementType.out,
            quantity=needed,
            description=f"Üretim #{data.product_id} - {product.name} x{data.quantity}"
        )
        db.add(mv)
    
    # Ürün stoğunu artır
    product.stock_quantity += data.quantity
    product_mv = StockMovement(
        product_id=product.id,
        type=MovementType.in_,
        quantity=data.quantity,
        description=f"Üretim tamamlandı: {product.name}"
    )
    db.add(product_mv)
    
    production = Production(
        product_id=data.product_id,
        order_id=data.order_id,
        quantity=data.quantity,
        status=ProductionStatus.completed,
        total_cost=total_cost,
        notes=data.notes,
        completed_at=datetime.utcnow()
    )
    db.add(production)
    db.commit()
    db.refresh(production)
    
    log_activity(db, current_user.id, "PRODUCTION", "Production", production.id, f"{product.name} x{data.quantity} üretildi")
    
    result = ProductionOut.model_validate(production).model_dump()
    result["product_name"] = product.name
    return result

@router.get("/{production_id}", response_model=dict)
def get_production(production_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Production).filter(Production.id == production_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Üretim kaydı bulunamadı")
    result = ProductionOut.model_validate(p).model_dump()
    result["product_name"] = p.product.name if p.product else None
    return result

@router.delete("/{production_id}")
def delete_production(production_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Herhangi bir üretim kaydını sil"""
    p = db.query(Production).filter(Production.id == production_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Üretim kaydı bulunamadı")
    db.delete(p)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "Production", production_id)
    return {"message": "Üretim kaydı silindi"}

@router.delete("/planned/{production_id}")
def delete_planned(production_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Planned kaydı sil (üretim tamamlandıktan sonra çağrılır)"""
    p = db.query(Production).filter(Production.id == production_id, Production.status == ProductionStatus.planned).first()
    if p:
        db.delete(p)
        db.commit()
    return {"message": "OK"}
