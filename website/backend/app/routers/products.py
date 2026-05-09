from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os, shutil, uuid
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..core.config import settings
from ..models.product import Product
from ..models.product_image import ProductImage

router = APIRouter(prefix="/api/products", tags=["products"])

def product_to_dict(p: Product) -> dict:
    imgs = p.images if p.images else []
    all_images = [img.image for img in imgs]
    image_ids = [img.id for img in imgs]
    main_image = all_images[0] if all_images else p.image

    # İndirim hesapla
    effective_discount = None
    if p.price and p.price > 0:
        if p.price_discounted and p.price_discounted < p.price:
            effective_discount = round((1 - p.price_discounted / p.price) * 100)
        elif p.discount_percent and p.discount_percent > 0:
            effective_discount = p.discount_percent

    return {
        "id": p.id,
        "name_tr": p.name_tr,
        "name_en": p.name_en,
        "description_tr": p.description_tr,
        "description_en": p.description_en,
        "details_tr": p.details_tr or "",
        "details_en": p.details_en or "",
        "image": main_image,
        "images": all_images,
        "image_ids": image_ids,
        "category_id": p.category_id,
        "is_active": p.is_active,
        "order": p.order,
        "price": p.price,
        "price_discounted": p.price_discounted,
        "discount_percent": effective_discount,
        "price_unit": p.price_unit or "adet",
        "min_order_qty": p.min_order_qty or 1,
        "show_price": p.show_price if p.show_price is not None else True,
        "price_note_tr": p.price_note_tr or "",
        "price_note_en": p.price_note_en or "",
        "category": {"id": p.category.id, "name_tr": p.category.name_tr, "name_en": p.category.name_en} if p.category else None
    }

def save_image(image: UploadFile) -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = image.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)
    return f"/uploads/{filename}"

def parse_category_id(val) -> Optional[int]:
    try:
        v = int(val)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None

def parse_float(val) -> Optional[float]:
    try:
        v = float(val)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None

def parse_int(val) -> Optional[int]:
    try:
        v = int(val)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None
    try:
        v = float(val)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None

def parse_int(val) -> Optional[int]:
    try:
        v = int(val)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None

@router.get("")
def list_products(category_id: Optional[int] = None, active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Product)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if active_only:
        q = q.filter(Product.is_active == True)
    return [product_to_dict(p) for p in q.order_by(Product.order).all()]

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
    details_tr: str = Form(""),
    details_en: str = Form(""),
    category_id: Optional[str] = Form(None),
    is_active: bool = Form(True),
    order: int = Form(0),
    price: Optional[str] = Form(None),
    price_discounted: Optional[str] = Form(None),
    discount_percent: Optional[str] = Form(None),
    price_unit: str = Form("adet"),
    min_order_qty: Optional[str] = Form(None),
    show_price: bool = Form(True),
    price_note_tr: str = Form(""),
    price_note_en: str = Form(""),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    p = Product(
        name_tr=name_tr, name_en=name_en,
        description_tr=description_tr, description_en=description_en,
        details_tr=details_tr, details_en=details_en,
        category_id=parse_category_id(category_id), is_active=is_active, order=order,
        price=parse_float(price),
        price_discounted=parse_float(price_discounted),
        discount_percent=parse_int(discount_percent),
        price_unit=price_unit,
        min_order_qty=parse_int(min_order_qty) or 1,
        show_price=show_price,
        price_note_tr=price_note_tr,
        price_note_en=price_note_en,
    )
    db.add(p)
    db.flush()
    for i, img in enumerate(images):
        if img and img.filename:
            path = save_image(img)
            db.add(ProductImage(product_id=p.id, image=path, order=i))
            if i == 0:
                p.image = path
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
    details_tr: str = Form(""),
    details_en: str = Form(""),
    category_id: Optional[str] = Form(None),
    is_active: bool = Form(True),
    order: int = Form(0),
    price: Optional[str] = Form(None),
    price_discounted: Optional[str] = Form(None),
    discount_percent: Optional[str] = Form(None),
    price_unit: str = Form("adet"),
    min_order_qty: Optional[str] = Form(None),
    show_price: bool = Form(True),
    price_note_tr: str = Form(""),
    price_note_en: str = Form(""),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")

    p.name_tr = name_tr
    p.name_en = name_en
    p.description_tr = description_tr
    p.description_en = description_en
    p.details_tr = details_tr
    p.details_en = details_en
    p.category_id = parse_category_id(category_id)
    p.is_active = is_active
    p.order = order
    p.price = parse_float(price)
    p.price_discounted = parse_float(price_discounted)
    p.discount_percent = parse_int(discount_percent)
    p.price_unit = price_unit
    p.min_order_qty = parse_int(min_order_qty) or 1
    p.show_price = show_price
    p.price_note_tr = price_note_tr
    p.price_note_en = price_note_en

    existing_count = len(p.images)
    for i, img in enumerate(images):
        if img and img.filename:
            path = save_image(img)
            db.add(ProductImage(product_id=p.id, image=path, order=existing_count + i))
            if existing_count == 0 and i == 0:
                p.image = path

    db.commit()
    db.refresh(p)
    return product_to_dict(p)

@router.delete("/{id}/images/{image_id}")
def delete_product_image(id: int, image_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    img = db.query(ProductImage).filter(ProductImage.id == image_id, ProductImage.product_id == id).first()
    if not img:
        raise HTTPException(404, "Not found")
    db.delete(img)
    p = db.query(Product).filter(Product.id == id).first()
    remaining = db.query(ProductImage).filter(ProductImage.product_id == id).order_by(ProductImage.order).all()
    p.image = remaining[0].image if remaining else ""
    db.commit()
    return {"ok": True}

@router.put("/{id}/images/{image_id}/primary")
def set_primary_image(id: int, image_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    img = db.query(ProductImage).filter(ProductImage.id == image_id, ProductImage.product_id == id).first()
    if not img:
        raise HTTPException(404, "Not found")
    all_imgs = db.query(ProductImage).filter(ProductImage.product_id == id).order_by(ProductImage.order).all()
    for i, im in enumerate(all_imgs):
        im.order = 0 if im.id == image_id else (i + 1)
    p = db.query(Product).filter(Product.id == id).first()
    p.image = img.image
    db.commit()
    return {"ok": True}

@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Not found")
    db.delete(p)
    db.commit()
    return {"ok": True}
