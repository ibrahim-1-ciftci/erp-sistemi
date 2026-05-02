from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.category import Category

router = APIRouter(prefix="/api/categories", tags=["categories"])

class CategoryIn(BaseModel):
    name_tr: str
    name_en: str
    slug: str
    order: int = 0

class CategoryOut(BaseModel):
    id: int
    name_tr: str
    name_en: str
    slug: str
    order: int
    class Config:
        from_attributes = True

@router.get("", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.order).all()

@router.post("", response_model=CategoryOut)
def create_category(data: CategoryIn, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.put("/{id}", response_model=CategoryOut)
def update_category(id: int, data: CategoryIn, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{id}")
def delete_category(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(404, "Not found")
    db.delete(cat)
    db.commit()
    return {"ok": True}
