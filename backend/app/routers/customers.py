from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, log_activity
from app.models.customer import Customer
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/customers", tags=["customers"])

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    payment_term_days: Optional[int] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    payment_term_days: Optional[int] = None

def build_customer_out(c: Customer, db: Session) -> dict:
    order_count = db.query(func.count(Order.id)).filter(Order.customer_id == c.id).scalar()
    total_spent = db.query(func.sum(Order.id)).filter(Order.customer_id == c.id).scalar()
    return {
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "email": c.email,
        "address": c.address,
        "notes": c.notes,
        "payment_term_days": c.payment_term_days,
        "created_at": c.created_at,
        "order_count": order_count or 0,
    }

@router.get("")
def list_customers(
    skip: int = 0, limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(Customer.name).offset(skip).limit(limit).all()
    return {"total": total, "items": [build_customer_out(c, db) for c in items]}

@router.post("")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    log_activity(db, current_user.id, "CREATE", "Customer", customer.id, f"Müşteri oluşturuldu: {customer.name}")
    return build_customer_out(customer, db)

@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    orders = db.query(Order).filter(Order.customer_id == customer_id).order_by(Order.created_at.desc()).all()
    result = build_customer_out(c, db)
    result["orders"] = [{"id": o.id, "status": o.status, "created_at": o.created_at, "notes": o.notes} for o in orders]
    return result

@router.put("/{customer_id}")
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(c, key, value)
    db.commit()
    db.refresh(c)
    log_activity(db, current_user.id, "UPDATE", "Customer", customer_id)
    return build_customer_out(c, db)

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    db.delete(c)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "Customer", customer_id)
    return {"message": "Müşteri silindi"}
