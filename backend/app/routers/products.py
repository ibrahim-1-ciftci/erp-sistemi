from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission, log_activity
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=dict)
def list_products(
    skip: int = 0, limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(Product.name).offset(skip).limit(limit).all()
    return {"total": total, "items": [ProductOut.model_validate(p) for p in items]}

@router.post("", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    log_activity(db, current_user.id, "CREATE", "Product", product.id, f"ÃœrÃ¼n oluÅŸturuldu: {product.name}")
    return product

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="ÃœrÃ¼n bulunamadÄ±")
    return product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="ÃœrÃ¼n bulunamadÄ±")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    log_activity(db, current_user.id, "UPDATE", "Product", product_id)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="ÃœrÃ¼n bulunamadÄ±")
    db.delete(product)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "Product", product_id)
    return {"message": "ÃœrÃ¼n silindi"}
