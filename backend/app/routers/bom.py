from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission, check_permission, log_activity
from app.models.bom import BOM, BOMItem
from app.models.product import Product
from app.models.raw_material import RawMaterial
from app.models.user import User
from app.schemas.bom import BOMCreate, BOMUpdate, BOMOut, BOMItemOut

router = APIRouter(prefix="/bom", tags=["bom"])

def build_bom_out(bom: BOM) -> dict:
    items = []
    total_cost = 0
    for item in sorted(bom.items, key=lambda x: x.order):
        rm = item.raw_material
        cost = rm.purchase_price * item.quantity_required
        total_cost += cost
        items.append({
            "id": item.id,
            "raw_material_id": item.raw_material_id,
            "raw_material_name": rm.name,
            "raw_material_unit": rm.unit,
            "purchase_price": rm.purchase_price,
            "quantity_required": item.quantity_required,
            "order": item.order,
            "line_cost": cost
        })
    return {
        "id": bom.id,
        "product_id": bom.product_id,
        "product_name": bom.product.name if bom.product else None,
        "version": bom.version,
        "notes": bom.notes,
        "created_at": bom.created_at,
        "items": items,
        "total_cost": total_cost
    }

@router.get("", response_model=dict)
def list_boms(
    skip: int = 0, limit: int = 20,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("bom", "view"))
):
    query = db.query(BOM)
    if product_id:
        query = query.filter(BOM.product_id == product_id)
    total = query.count()
    boms = query.order_by(BOM.product_id, BOM.version.desc()).offset(skip).limit(limit).all()
    # Ürün adına göre alfabetik grupla
    result = [build_bom_out(b) for b in boms]
    result.sort(key=lambda x: (x['product_name'] or '').lower())
    return {"total": total, "items": result}

@router.post("", response_model=dict)
def create_bom(data: BOMCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    # Yeni versiyon numarası
    last = db.query(BOM).filter(BOM.product_id == data.product_id).order_by(BOM.version.desc()).first()
    version = (last.version + 1) if last else 1
    
    bom = BOM(product_id=data.product_id, version=version, notes=data.notes)
    db.add(bom)
    db.flush()
    
    for item_data in data.items:
        rm = db.query(RawMaterial).filter(RawMaterial.id == item_data.raw_material_id).first()
        if not rm:
            raise HTTPException(status_code=404, detail=f"Hammadde bulunamadı: {item_data.raw_material_id}")
        item = BOMItem(bom_id=bom.id, raw_material_id=item_data.raw_material_id,
                       quantity_required=item_data.quantity_required, order=item_data.order or 0)
        db.add(item)
    
    db.commit()
    db.refresh(bom)
    log_activity(db, current_user.id, "CREATE", "BOM", bom.id, f"Reçete oluşturuldu: {product.name} v{version}")
    return build_bom_out(bom)

@router.get("/product/{product_id}/latest", response_model=dict)
def get_latest_bom(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.product_id == product_id).order_by(BOM.version.desc()).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Bu ürün için reçete bulunamadı")
    return build_bom_out(bom)

@router.get("/{bom_id}", response_model=dict)
def get_bom(bom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    return build_bom_out(bom)

@router.put("/{bom_id}", response_model=dict)
def update_bom(bom_id: int, data: BOMUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    if data.notes is not None:
        bom.notes = data.notes
    if data.items is not None:
        for old_item in bom.items:
            db.delete(old_item)
        db.flush()
        for item_data in data.items:
            item = BOMItem(bom_id=bom.id, raw_material_id=item_data.raw_material_id,
                           quantity_required=item_data.quantity_required, order=item_data.order or 0)
            db.add(item)
    db.commit()
    db.refresh(bom)
    log_activity(db, current_user.id, "UPDATE", "BOM", bom_id)
    return build_bom_out(bom)

@router.delete("/{bom_id}")
def delete_bom(bom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    db.delete(bom)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "BOM", bom_id)
    return {"message": "Reçete silindi"}
