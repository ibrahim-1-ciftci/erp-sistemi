from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.order import WebOrder

router = APIRouter(prefix="/api/orders", tags=["orders"])

class CustomerInfo(BaseModel):
    name: str
    email: str
    phone: str = ""
    address: str = ""
    city: str = ""
    note: str = ""

class OrderItem(BaseModel):
    product_id: int
    name: str
    qty: int
    price: float = 0

class CreateOrderRequest(BaseModel):
    customer: CustomerInfo
    items: List[OrderItem]
    payment_method: str = "transfer"
    total: float = 0
    lang: str = "tr"

def order_to_dict(o: WebOrder) -> dict:
    return {
        "id": o.id,
        "customer_name": o.customer_name,
        "customer_email": o.customer_email,
        "customer_phone": o.customer_phone,
        "customer_address": o.customer_address,
        "customer_city": o.customer_city,
        "note": o.note,
        "items": o.items,
        "total": o.total,
        "payment_method": o.payment_method,
        "status": o.status,
        "lang": o.lang,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    }

@router.post("")
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    order = WebOrder(
        customer_name=req.customer.name,
        customer_email=req.customer.email,
        customer_phone=req.customer.phone,
        customer_address=req.customer.address,
        customer_city=req.customer.city,
        note=req.customer.note,
        items=[i.dict() for i in req.items],
        total=req.total,
        payment_method=req.payment_method,
        lang=req.lang,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Mail bildirimleri — kart ödemesinde mail PayTR notify gelince gönderilir
    if req.payment_method != 'card':
        try:
            from ..core.mail import send_email, mail_order_received, mail_admin_new_order
            from ..core.config import settings as cfg
            if order.customer_email:
                subj, body = mail_order_received(order, req.lang)
                send_email(order.customer_email, subj, body)
            if cfg.MAIL_TO:
                subj, body = mail_admin_new_order(order)
                send_email(cfg.MAIL_TO, subj, body)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Mail hatası: {e}")

    return {"id": order.id, "status": "ok"}

@router.get("")
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    q = db.query(WebOrder)
    if status:
        q = q.filter(WebOrder.status == status)
    return [order_to_dict(o) for o in q.order_by(WebOrder.created_at.desc()).all()]

@router.get("/{id}")
def get_order(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    o = db.query(WebOrder).filter(WebOrder.id == id).first()
    if not o:
        raise HTTPException(404, "Not found")
    return order_to_dict(o)

@router.put("/{id}/status")
def update_status(id: int, body: dict, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    o = db.query(WebOrder).filter(WebOrder.id == id).first()
    if not o:
        raise HTTPException(404, "Not found")
    old_status = o.status
    o.status = body.get("status", o.status)
    db.commit()

    # Durum maillerini gönder
    try:
        from ..core.mail import send_email, mail_order_received, mail_order_shipped
        from ..core.config import settings as cfg

        # Onaylandı → müşteriye sipariş alındı maili
        if o.status == "confirmed" and old_status != "confirmed" and o.customer_email:
            subj, html = mail_order_received(o, o.lang or "tr")
            send_email(o.customer_email, subj, html)

        # Kargoya verildi → müşteriye kargo maili
        if o.status == "shipped" and old_status != "shipped" and o.customer_email:
            subj, html = mail_order_shipped(o, o.lang or "tr")
            send_email(o.customer_email, subj, html)

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Durum mail hatası: {e}")

    return {"ok": True}

@router.delete("/{id}")
def delete_order(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    o = db.query(WebOrder).filter(WebOrder.id == id).first()
    if not o:
        raise HTTPException(404, "Not found")
    db.delete(o)
    db.commit()
    return {"ok": True}
