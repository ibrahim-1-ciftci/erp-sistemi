from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from io import BytesIO
from pydantic import BaseModel
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from app.core.database import get_db
from app.core.deps import get_current_user, log_activity
from app.models.payment import Payment, PaymentStatus
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentItem(BaseModel):
    product_name: str
    quantity: float
    unit: str = "adet"
    unit_price: float

class PaymentCreate(BaseModel):
    order_id: Optional[int] = None
    customer_name_override: Optional[str] = None
    order_date: Optional[date] = None
    total_amount: float
    due_date: date
    items: Optional[List[PaymentItem]] = []
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    paid_amount: Optional[float] = None
    paid_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None

def compute_status(p: Payment) -> str:
    paid = p.paid_amount or 0
    if paid >= p.total_amount:
        return PaymentStatus.paid
    if paid > 0:
        return PaymentStatus.partial
    if p.due_date < date.today():
        return PaymentStatus.overdue
    return PaymentStatus.pending

def build_out(p: Payment) -> dict:
    status = compute_status(p)
    remaining = p.total_amount - (p.paid_amount or 0)
    overdue_days = (date.today() - p.due_date).days if p.due_date < date.today() and status != PaymentStatus.paid else 0
    items = []
    if p.items_json:
        try:
            items = json.loads(p.items_json)
        except Exception:
            items = []
    return {
        "id": p.id,
        "order_id": p.order_id,
        "customer_name": p.customer_name,
        "order_date": p.order_date,
        "items": items,
        "total_amount": p.total_amount,
        "paid_amount": p.paid_amount or 0,
        "remaining": remaining,
        "due_date": p.due_date,
        "paid_date": p.paid_date,
        "status": status,
        "notes": p.notes,
        "created_at": p.created_at,
        "overdue_days": overdue_days,
    }

@router.get("")
def list_payments(status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payments = db.query(Payment).order_by(Payment.due_date).all()
    result = [build_out(p) for p in payments]
    if status:
        result = [r for r in result if r["status"] == status]
    total_pending = sum(r["remaining"] for r in result if r["status"] != PaymentStatus.paid)
    overdue_count = sum(1 for r in result if r["status"] == PaymentStatus.overdue)
    return {"items": result, "total_pending": total_pending, "overdue_count": overdue_count}

@router.get("/calendar")
def calendar_view(year: int, month: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from calendar import monthrange
    _, last_day = monthrange(year, month)
    payments = db.query(Payment).filter(
        Payment.due_date >= date(year, month, 1),
        Payment.due_date <= date(year, month, last_day)
    ).all()
    by_day = {}
    for p in payments:
        day = p.due_date.day
        if day not in by_day:
            by_day[day] = []
        by_day[day].append(build_out(p))
    return {"year": year, "month": month, "by_day": by_day}

@router.post("")
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.order_id:
        order = db.query(Order).filter(Order.id == data.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
        customer_name = data.customer_name_override or order.customer_name
    elif data.customer_name_override:
        customer_name = data.customer_name_override
    else:
        raise HTTPException(status_code=400, detail="Sipariş veya müşteri adı gerekli")

    items_json = json.dumps([i.model_dump() for i in (data.items or [])], ensure_ascii=False)
    payment = Payment(
        order_id=data.order_id,
        customer_name=customer_name,
        order_date=data.order_date,
        total_amount=data.total_amount,
        due_date=data.due_date,
        items_json=items_json,
        notes=data.notes
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    log_activity(db, current_user.id, "CREATE", "Payment", payment.id, f"Vade oluşturuldu: {customer_name}")
    return build_out(payment)

@router.put("/{payment_id}")
def update_payment(payment_id: int, data: PaymentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(p, key, value)
    if data.paid_amount is not None and data.paid_amount >= p.total_amount and not p.paid_date:
        p.paid_date = date.today()
    db.commit()
    db.refresh(p)
    log_activity(db, current_user.id, "UPDATE", "Payment", payment_id)
    return build_out(p)

@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    db.delete(p)
    db.commit()
    return {"message": "Silindi"}

@router.get("/export")
def export_payments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payments = db.query(Payment).order_by(Payment.due_date).all()
    result = [build_out(p) for p in payments]
    if status:
        result = [r for r in result if r["status"] == status]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Vade Takibi"

    # Şirket başlığı
    ws.merge_cells("A1:H1")
    title_c = ws.cell(row=1, column=1, value="Laves Kimya - Vade Takibi")
    title_c.font = Font(bold=True, size=14, color="FFFFFF")
    title_c.fill = PatternFill("solid", fgColor="1e40af")
    title_c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 24

    # Stiller
    header_fill = PatternFill("solid", fgColor="1e40af")
    header_font = Font(color="FFFFFF", bold=True, size=10)
    sub_fill = PatternFill("solid", fgColor="dbeafe")
    sub_font = Font(bold=True, size=9, color="1e3a8a")
    thin = Side(style="thin", color="d1d5db")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    center = Alignment(horizontal="center", vertical="center")

    STATUS_TR = {"pending": "Bekliyor", "overdue": "Gecikmiş", "partial": "Kısmi Ödeme", "paid": "Ödendi"}

    row = 3
    for p in result:
        # Müşteri başlık satırı
        ws.merge_cells(f"A{row}:H{row}")
        title_cell = ws.cell(row=row, column=1,
            value=f"Müşteri: {p['customer_name']}  |  Sipariş Tarihi: {p['order_date'] or '-'}  |  Vade: {p['due_date']}  |  Durum: {STATUS_TR.get(p['status'], p['status'])}")
        title_cell.fill = header_fill
        title_cell.font = header_font
        title_cell.alignment = Alignment(vertical="center", wrap_text=True)
        ws.row_dimensions[row].height = 20
        row += 1

        # Ürün başlıkları
        headers = ["Ürün Adı", "Miktar", "Birim", "Birim Fiyat (₺)", "Toplam (₺)", "", "", ""]
        for col, h in enumerate(headers, 1):
            c = ws.cell(row=row, column=col, value=h)
            c.fill = sub_fill
            c.font = sub_font
            c.border = border
            c.alignment = center
        row += 1

        # Ürün satırları
        if p["items"]:
            for item in p["items"]:
                total = item["quantity"] * item["unit_price"]
                vals = [item["product_name"], item["quantity"], item["unit"], item["unit_price"], total, "", "", ""]
                for col, v in enumerate(vals, 1):
                    c = ws.cell(row=row, column=col, value=v)
                    c.border = border
                    if col in (4, 5):
                        c.number_format = '#,##0.00 ₺'
                row += 1
        else:
            ws.cell(row=row, column=1, value="(ürün detayı girilmemiş)").font = Font(italic=True, color="9ca3af")
            row += 1

        # Özet satırı
        summary_vals = ["", "", "", "Toplam:", f"₺{p['total_amount']:,.2f}",
                        f"Ödenen: ₺{p['paid_amount']:,.2f}", f"Kalan: ₺{p['remaining']:,.2f}", ""]
        for col, v in enumerate(summary_vals, 1):
            c = ws.cell(row=row, column=col, value=v)
            c.font = Font(bold=True, size=9)
            if col in (4, 5, 6, 7):
                c.fill = PatternFill("solid", fgColor="f0fdf4")
        row += 1

        # Notlar
        if p["notes"]:
            ws.cell(row=row, column=1, value=f"Not: {p['notes']}").font = Font(italic=True, size=8, color="6b7280")
            row += 1

        # Boş ayırıcı satır
        row += 1

    col_widths = [30, 10, 10, 16, 16, 18, 18, 10]
    for i, w in enumerate(col_widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=vade_takibi.xlsx"}
    )
