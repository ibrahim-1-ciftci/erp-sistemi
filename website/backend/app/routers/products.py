from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os, shutil, uuid
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..core.config import settings
from ..models.product import Product
from ..models.category import Category

router = APIRouter(prefix="/api/products", tags=["products"])

class ProductOut(BaseModel):
    id: int
    name_tr: str
    name_en: str
    description_tr: str
    description_en: str
    image: str
    category_id: Optional[int]
    is_active: bool
    order: int
    category: Optional[dict] = None
    class Config:
        from_attributes = True

def product_to_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "name_tr": p.name_tr,
        "name_en": p.name_en,
        "description_tr": p.description_tr,
        "description_en": p.description_en,
        "image": p.image,
        "category_id": p.category_id,
        "is_active": p.is_active,
        "order": p.order,
        "category": {"id": p.category.id, "name_tr": p.category.name_tr, "name_en": p.category.name_en} if p.category else None
    }

@router.get("")
def list_products(category_id: Optional[int] = None, active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Product)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if active_only:
        q = q.filter(Product.is_active == True)
    products = q.order_by(Product.order).all()
    return [product_to_dict(p) for p in products]

@router.get("/{id}")
def get_product(id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")
    return product_to_dict(p)

@router.post("")
def create_product(
    name_tr: str = Form(...),
    name_en: str = Form(...),
    description_tr: str = Form(""),
    description_en: str = Form(""),
    category_id: Optional[int] = Form(None),
    is_active: bool = Form(True),
    order: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    image_path = ""
    if image and image.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_path = f"/uploads/{filename}"

    p = Product(
        name_tr=name_tr, name_en=name_en,
        description_tr=description_tr, description_en=description_en,
        image=image_path, category_id=category_id,
        is_active=is_active, order=order
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return product_to_dict(p)

@router.put("/{id}")
def update_product(
    id: int,
    name_tr: str = Form(...),
    name_en: str = Form(...),
    description_tr: str = Form(""),
    description_en: str = Form(""),
    category_id: Optional[int] = Form(None),
    is_active: bool = Form(True),
    order: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")

    if image and image.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(image.file, f)
        p.image = f"/uploads/{filename}"

    p.name_tr = name_tr
    p.name_en = name_en
    p.description_tr = description_tr
    p.description_en = description_en
    p.category_id = category_id
    p.is_active = is_active
    p.order = order
    db.commit()
    db.refresh(p)
    return product_to_dict(p)

@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")
    db.delete(p)
    db.commit()
    return {"ok": True}
