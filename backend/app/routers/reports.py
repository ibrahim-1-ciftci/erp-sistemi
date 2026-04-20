from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date, timedelta
from io import BytesIO
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission
from app.models.raw_material import RawMaterial
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.production import Production, ProductionStatus
from app.models.stock_movement import StockMovement
from app.models.activity_log import ActivityLog
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

COMPANY_NAME = "Laves Kimya"

def add_company_header(ws, col_count: int):
    ws.merge_cells(f"A1:{openpyxl.utils.get_column_letter(col_count)}1")
    c = ws.cell(row=1, column=1, value=COMPANY_NAME)
    c.font = Font(bold=True, size=14, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="1e40af")
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 24
    return 3  # veri başlangıç satırı


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.payment import Payment
    from app.models.debt import Debt
    materials = db.query(RawMaterial).all()
    low_stock = [m for m in materials if m.stock_quantity < m.min_stock_level]
    total_material_value = sum(m.stock_quantity * m.purchase_price for m in materials)

    products = db.query(Product).all()
    total_product_value = sum(p.stock_quantity * p.sale_price for p in products)

    pending_orders = db.query(Order).filter(Order.status == OrderStatus.pending).count()
    in_production_orders = db.query(Order).filter(Order.status == OrderStatus.in_production).count()

    today_productions = db.query(Production).filter(
        Production.status == ProductionStatus.completed,
        func.date(Production.completed_at) == func.current_date()
    ).all()

    # Son 6 ay üretim maliyeti
    monthly_production = []
    for i in range(5, -1, -1):
        d = date.today().replace(day=1) - timedelta(days=i*28)
        month_start = d.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year+1, month=1, day=1)
        else:
            month_end = month_start.replace(month=month_start.month+1, day=1)
        cost = db.query(func.sum(Production.total_cost)).filter(
            Production.status == ProductionStatus.completed,
            func.date(Production.completed_at) >= month_start,
            func.date(Production.completed_at) < month_end
        ).scalar() or 0
        revenue = db.query(func.sum(Production.total_cost)).filter(
            Production.status == ProductionStatus.completed,
            func.date(Production.completed_at) >= month_start,
            func.date(Production.completed_at) < month_end
        ).scalar() or 0
        monthly_production.append({
            "month": month_start.strftime("%b %Y"),
            "cost": round(cost, 2),
        })

    # Vade & borç özeti
    payments = db.query(Payment).all()
    total_receivable = sum(p.total_amount - (p.paid_amount or 0) for p in payments if (p.paid_amount or 0) < p.total_amount)
    debts = db.query(Debt).all()
    total_payable = sum(d.total_amount - (d.paid_amount or 0) for d in debts if (d.paid_amount or 0) < d.total_amount)

    # Kasa / Ciro — bu ay
    from app.models.cashflow import CashFlow
    from datetime import date as dt_date
    month_start = dt_date.today().replace(day=1)
    cashflows = db.query(CashFlow).filter(CashFlow.flow_date >= month_start).all()
    monthly_cash_income  = sum(f.amount for f in cashflows if f.flow_type == "income")
    monthly_cash_expense = sum(f.amount for f in cashflows if f.flow_type == "expense")
    monthly_cash_net     = monthly_cash_income - monthly_cash_expense
    # Bugünkü kasa
    today_flows = db.query(CashFlow).filter(CashFlow.flow_date == dt_date.today()).all()
    today_income  = sum(f.amount for f in today_flows if f.flow_type == "income")
    today_expense = sum(f.amount for f in today_flows if f.flow_type == "expense")

    return {
        "low_stock_count": len(low_stock),
        "low_stock_items": [{"id": m.id, "name": m.name, "stock_quantity": m.stock_quantity, "min_stock_level": m.min_stock_level, "unit": m.unit} for m in low_stock],
        "total_material_value": total_material_value,
        "total_product_value": total_product_value,
        "total_stock_value": total_material_value + total_product_value,
        "pending_orders": pending_orders,
        "in_production_orders": in_production_orders,
        "today_production_count": len(today_productions),
        "today_production_cost": sum(p.total_cost for p in today_productions),
        "total_products": len(products),
        "total_materials": len(materials),
        "monthly_production": monthly_production,
        "total_receivable": round(total_receivable, 2),
        "total_payable": round(total_payable, 2),
        "monthly_cash_income": round(monthly_cash_income, 2),
        "monthly_cash_expense": round(monthly_cash_expense, 2),
        "monthly_cash_net": round(monthly_cash_net, 2),
        "today_income": round(today_income, 2),
        "today_expense": round(today_expense, 2),
    }

@router.get("/stock-movements")
def stock_movements(
    skip: int = 0, limit: int = 100,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    movement_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StockMovement)
    if date_from:
        query = query.filter(func.date(StockMovement.created_at) >= date_from)
    if date_to:
        query = query.filter(func.date(StockMovement.created_at) <= date_to)
    if movement_type:
        query = query.filter(StockMovement.type == movement_type)
    total = query.count()
    movements = query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for mv in movements:
        mat_name = mv.material.name if mv.material else None
        prd_name = mv.product.name if mv.product else None
        name = mat_name or prd_name or ''
        # Arama filtresi — Python tarafında (join yazmaktan kaçınmak için)
        if search and search.lower() not in name.lower() and search.lower() not in (mv.description or '').lower():
            continue
        result.append({
            "id": mv.id,
            "type": mv.type,
            "quantity": mv.quantity,
            "description": mv.description,
            "created_at": mv.created_at,
            "material_name": mat_name,
            "product_name": prd_name,
        })
    return {"total": total, "items": result}

@router.get("/activity-logs")
def activity_logs(
    skip: int = 0, limit: int = 100,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    action_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ActivityLog)
    if date_from:
        query = query.filter(func.date(ActivityLog.created_at) >= date_from)
    if date_to:
        query = query.filter(func.date(ActivityLog.created_at) <= date_to)
    if action_filter:
        query = query.filter(ActivityLog.action == action_filter)
    if search:
        query = query.filter(
            ActivityLog.details.ilike(f"%{search}%") |
            ActivityLog.entity.ilike(f"%{search}%") |
            ActivityLog.action.ilike(f"%{search}%")
        )
    total = query.count()
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": logs}


@router.delete("/cleanup")
def cleanup_old_logs(
    days: int = 15,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """15 günden eski activity_log ve stock_movement kayıtlarını sil."""
    from datetime import datetime, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    deleted_logs = db.query(ActivityLog).filter(ActivityLog.created_at < cutoff).delete()
    deleted_movements = db.query(StockMovement).filter(StockMovement.created_at < cutoff).delete()
    db.commit()
    return {"deleted_logs": deleted_logs, "deleted_movements": deleted_movements, "cutoff_days": days}

@router.get("/profitability")
def profitability(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Production).filter(Production.status == ProductionStatus.completed)
    if date_from:
        query = query.filter(func.date(Production.completed_at) >= date_from)
    if date_to:
        query = query.filter(func.date(Production.completed_at) <= date_to)
    productions = query.all()
    result = []
    for p in productions:
        revenue = p.product.sale_price * p.quantity if p.product else 0
        profit = revenue - p.total_cost
        result.append({
            "production_id": p.id,
            "product_name": p.product.name if p.product else None,
            "quantity": p.quantity,
            "total_cost": p.total_cost,
            "revenue": revenue,
            "profit": profit,
            "margin_pct": (profit / revenue * 100) if revenue > 0 else 0,
            "completed_at": p.completed_at
        })
    return result

@router.get("/export/stock-movements")
def export_stock_movements(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StockMovement)
    if date_from:
        query = query.filter(func.date(StockMovement.created_at) >= date_from)
    if date_to:
        query = query.filter(func.date(StockMovement.created_at) <= date_to)
    movements = query.order_by(StockMovement.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Stok Hareketleri"

    header_fill = PatternFill("solid", fgColor="1e40af")
    header_font = Font(color="FFFFFF", bold=True)
    headers = ["Tarih", "Tür", "Malzeme/Ürün", "Miktar", "Açıklama"]
    start_row = add_company_header(ws, len(headers))
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    for row, mv in enumerate(movements, start_row + 1):
        ws.cell(row=row, column=1, value=mv.created_at.strftime("%d.%m.%Y %H:%M") if mv.created_at else "")
        ws.cell(row=row, column=2, value="Giriş" if mv.type == "in" else "Çıkış")
        ws.cell(row=row, column=3, value=mv.material.name if mv.material else (mv.product.name if mv.product else "-"))
        ws.cell(row=row, column=4, value=mv.quantity)
        ws.cell(row=row, column=5, value=mv.description or "")

    for col in ws.columns:
        first_cell = col[0]
        if hasattr(first_cell, 'column_letter'):
            ws.column_dimensions[first_cell.column_letter].width = 20

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=stok_hareketleri.xlsx"}
    )

@router.get("/export/profitability")
def export_profitability(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Production).filter(Production.status == ProductionStatus.completed)
    if date_from:
        query = query.filter(func.date(Production.completed_at) >= date_from)
    if date_to:
        query = query.filter(func.date(Production.completed_at) <= date_to)
    productions = query.all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Karlılık Raporu"

    header_fill = PatternFill("solid", fgColor="1e40af")
    header_font = Font(color="FFFFFF", bold=True)
    headers = ["Ürün", "Adet", "Maliyet (₺)", "Gelir (₺)", "Kâr (₺)", "Marj (%)", "Tarih"]
    start_row = add_company_header(ws, len(headers))
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font

    for row, p in enumerate(productions, start_row + 1):
        revenue = p.product.sale_price * p.quantity if p.product else 0
        profit = revenue - p.total_cost
        margin = (profit / revenue * 100) if revenue > 0 else 0
        ws.cell(row=row, column=1, value=p.product.name if p.product else "-")
        ws.cell(row=row, column=2, value=p.quantity)
        ws.cell(row=row, column=3, value=round(p.total_cost, 2))
        ws.cell(row=row, column=4, value=round(revenue, 2))
        ws.cell(row=row, column=5, value=round(profit, 2))
        ws.cell(row=row, column=6, value=round(margin, 1))
        ws.cell(row=row, column=7, value=p.completed_at.strftime("%d.%m.%Y") if p.completed_at else "")

    for col in ws.columns:
        first_cell = col[0]
        if hasattr(first_cell, 'column_letter'):
            ws.column_dimensions[first_cell.column_letter].width = 18

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=karlilik_raporu.xlsx"}
    )
