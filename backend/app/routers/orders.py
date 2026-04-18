from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission, check_permission, log_activity
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])

def build_order_out(order: Order) -> dict:
    items = []
    total_value = 0
    for item in order.items:
        price = item.unit_price or (item.product.sale_price if item.product else 0)
        total_value += price * item.quantity
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else None,
            "quantity": item.quantity,
            "unit_price": price
        })
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "customer_email": order.customer_email,
        "status": order.status,
        "notes": order.notes,
        "shipped_at": order.shipped_at,
        "created_at": order.created_at,
        "items": items,
        "total_value": total_value
    }

@router.get("", response_model=dict)
def list_orders(
    skip: int = 0, limit: int = 20,
    status: Optional[str] = None,
    exclude_status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("orders", "view"))
):
    from datetime import date as dt_date
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if exclude_status:
        query = query.filter(Order.status != exclude_status)
    if search:
        query = query.filter(Order.customer_name.ilike(f"%{search}%"))
    if date_from:
        query = query.filter(func.date(Order.created_at) >= date_from)
    if date_to:
        query = query.filter(func.date(Order.created_at) <= date_to)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [build_order_out(o) for o in orders]}

@router.post("", response_model=dict)
def create_order(data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = Order(
        customer_id=data.customer_id,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        notes=data.notes
    )
    db.add(order)
    db.flush()
    for item_data in data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Ürün bulunamadı: {item_data.product_id}")
        item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price or product.sale_price
        )
        db.add(item)
    db.commit()
    db.refresh(order)
    log_activity(db, current_user.id, "CREATE", "Order", order.id, f"Sipariş oluşturuldu: {order.customer_name}")
    return build_order_out(order)

@router.get("/{order_id}", response_model=dict)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return build_order_out(order)

@router.put("/{order_id}", response_model=dict)
def update_order(order_id: int, data: OrderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    log_activity(db, current_user.id, "UPDATE", "Order", order_id)
    return build_order_out(order)

@router.post("/{order_id}/send-to-production", response_model=dict)
def send_to_production(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.production import Production, ProductionStatus
    from app.models.bom import BOM

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=400, detail="Sadece bekleyen siparişler üretime alınabilir")

    order.status = OrderStatus.in_production
    db.flush()

    # Her sipariş kalemi için Production kaydı oluştur
    for item in order.items:
        bom = db.query(BOM).filter(BOM.product_id == item.product_id).order_by(BOM.version.desc()).first()
        production = Production(
            product_id=item.product_id,
            order_id=order.id,
            quantity=item.quantity,
            status=ProductionStatus.planned,
            total_cost=0,
            notes=f"Sipariş #{order.id} - {order.customer_name}"
        )
        db.add(production)

    db.commit()
    log_activity(db, current_user.id, "PRODUCTION_START", "Order", order_id, "Sipariş üretime alındı")
    return build_order_out(order)

@router.post("/{order_id}/complete", response_model=dict)
def complete_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    order.status = OrderStatus.completed
    db.commit()
    log_activity(db, current_user.id, "COMPLETE", "Order", order_id)
    return build_order_out(order)

@router.post("/{order_id}/ship", response_model=dict)
def ship_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Siparişi sevkiyata al. Müşterinin vade günü varsa otomatik vade kaydı oluşturur."""
    from app.models.customer import Customer
    from app.models.payment import Payment
    from datetime import date, timedelta
    import json

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    if order.status not in (OrderStatus.completed, OrderStatus.in_production):
        raise HTTPException(status_code=400, detail="Sadece tamamlanan veya üretimdeki siparişler sevk edilebilir")

    now = datetime.now(timezone.utc)
    order.status = OrderStatus.shipped
    order.shipped_at = now
    db.flush()

    # items'ı commit öncesi belleğe al — commit sonrası lazy load sorununu önler
    order_items_snapshot = [
        {
            "product_name": item.product.name if item.product else "Ürün",
            "quantity": item.quantity,
            "unit_price": item.unit_price or (item.product.sale_price if item.product else 0),
        }
        for item in order.items
    ]

    # Müşterinin vade günü varsa otomatik payment oluştur
    payment_created = False
    if order.customer_id:
        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        if customer and customer.payment_term_days:
            ship_date = now.date()
            due_date = ship_date + timedelta(days=customer.payment_term_days)
            total_value = sum(
                i["unit_price"] * i["quantity"]
                for i in order_items_snapshot
            )
            from app.routers.settings import get_setting
            default_unit = get_setting(db, "default_unit") or "adet"
            items_data = [
                {
                    "product_name": i["product_name"],
                    "quantity": i["quantity"],
                    "unit": default_unit,
                    "unit_price": i["unit_price"]
                }
                for i in order_items_snapshot
            ]
            payment = Payment(
                order_id=order.id,
                customer_name=order.customer_name,
                order_date=ship_date,
                total_amount=total_value,
                due_date=due_date,
                items_json=json.dumps(items_data, ensure_ascii=False),
                notes=f"Otomatik oluşturuldu - {customer.payment_term_days} gün vade"
            )
            db.add(payment)
            payment_created = True

    db.commit()
    log_activity(db, current_user.id, "SHIP", "Order", order_id,
                 f"Sevkiyata alındı{'+ vade kaydı oluşturuldu' if payment_created else ''}")

    # Otomatik teslimat fişi oluştur
    try:
        from app.models.delivery_note import DeliveryNote
        from app.routers.settings import get_setting
        default_unit = get_setting(db, "default_unit") or "adet"
        year = now.strftime("%Y")
        count = db.query(DeliveryNote).count() + 1
        note_number = f"{year}-{count:05d}"
        dn_items = [
            {
                "product_name": i["product_name"],
                "quantity": i["quantity"],
                "unit": default_unit,
            }
            for i in order_items_snapshot
        ]
        dn = DeliveryNote(
            order_id=order.id,
            note_number=note_number,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            shipped_at=now,
            items_json=json.dumps(dn_items, ensure_ascii=False),
        )
        db.add(dn)
        db.commit()
        db.refresh(dn)
        delivery_note_id = dn.id
    except Exception as e:
        import traceback
        print(f"[DeliveryNote] Hata: {e}")
        traceback.print_exc()
        db.rollback()
        delivery_note_id = None

    result = build_order_out(order)
    result["payment_auto_created"] = payment_created
    result["delivery_note_id"] = delivery_note_id
    return result

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.production import Production, ProductionStatus
    from app.models.payment import Payment
    from app.models.raw_material import RawMaterial
    from app.models.stock_movement import StockMovement, MovementType
    from app.models.bom import BOM

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")

    # Tamamlanmış üretimlerin stoklarını geri al
    productions = db.query(Production).filter(Production.order_id == order_id).all()
    for p in productions:
        if p.status == ProductionStatus.completed:
            # Hammaddeleri geri ekle
            bom = db.query(BOM).filter(BOM.product_id == p.product_id).order_by(BOM.version.desc()).first()
            if bom:
                for item in bom.items:
                    rm = db.query(RawMaterial).filter(RawMaterial.id == item.raw_material_id).first()
                    if rm:
                        needed = item.quantity_required * p.quantity
                        rm.stock_quantity += needed
                        db.add(StockMovement(
                            material_id=rm.id,
                            type=MovementType.in_,
                            quantity=needed,
                            description=f"Sipariş #{order_id} silindi — stok iadesi"
                        ))
            # Ürün stoğunu düş
            product = db.query(Product).filter(Product.id == p.product_id).first()
            if product:
                product.stock_quantity = max(0, product.stock_quantity - p.quantity)
                db.add(StockMovement(
                    product_id=product.id,
                    type=MovementType.out,
                    quantity=p.quantity,
                    description=f"Sipariş #{order_id} silindi — ürün stok iadesi"
                ))
        db.delete(p)

    db.query(Payment).filter(Payment.order_id == order_id).delete()
    db.delete(order)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "Order", order_id)
    return {"message": "Sipariş silindi"}
