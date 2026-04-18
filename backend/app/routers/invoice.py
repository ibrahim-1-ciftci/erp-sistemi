from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.order import Order
from app.models.user import User

def get_company_settings(db):
    from app.routers.settings import get_setting
    return {
        "company_name": get_setting(db, "company_name"),
        "company_sub":  get_setting(db, "company_sub"),
        "kdv_rate":     float(get_setting(db, "kdv_rate") or "20") / 100,
    }

router = APIRouter(prefix="/invoices", tags=["invoices"])

COMPANY_NAME = "Laves Kimya"
COMPANY_SUB  = "Uretim ve Isletme Yonetim Sistemi"

# Windows ve Linux sistem fontlarından Türkçe destekli font kaydet
def register_turkish_font():
    candidates = [
        # Windows
        ("C:/Windows/Fonts/arial.ttf",   "C:/Windows/Fonts/arialbd.ttf"),
        ("C:/Windows/Fonts/calibri.ttf", "C:/Windows/Fonts/calibrib.ttf"),
        ("C:/Windows/Fonts/tahoma.ttf",  "C:/Windows/Fonts/tahomabd.ttf"),
        # Linux - Liberation (Arial muadili, Türkçe destekli)
        ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
        # Linux - DejaVu
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for regular, bold in candidates:
        if os.path.exists(regular):
            name = os.path.splitext(os.path.basename(regular))[0]
            try:
                pdfmetrics.registerFont(TTFont(name, regular))
                if os.path.exists(bold):
                    pdfmetrics.registerFont(TTFont(name + "-Bold", bold))
                    return name, name + "-Bold"
                return name, name
            except Exception:
                continue
    return "Helvetica", "Helvetica-Bold"

FONT_NAME, FONT_BOLD = register_turkish_font()


def generate_invoice_pdf(order: Order, db) -> BytesIO:
    cs = get_company_settings(db)
    COMPANY_NAME = cs["company_name"]
    COMPANY_SUB  = cs["company_sub"]
    KDV_RATE     = cs["kdv_rate"]
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('title', fontName=FONT_BOLD, fontSize=22,
                                  textColor=colors.HexColor('#1e40af'), spaceAfter=4)
    sub_style   = ParagraphStyle('sub',   fontName=FONT_NAME, fontSize=9, textColor=colors.grey)
    right_style = ParagraphStyle('right', fontName=FONT_NAME, fontSize=10, alignment=TA_RIGHT)
    bold_style  = ParagraphStyle('bold',  fontName=FONT_BOLD, fontSize=10)
    normal      = ParagraphStyle('norm',  fontName=FONT_NAME, fontSize=10)
    footer_style= ParagraphStyle('foot',  fontName=FONT_NAME, fontSize=8,
                                  textColor=colors.grey, alignment=TA_CENTER)

    # Header
    header_data = [
        [Paragraph(COMPANY_NAME, title_style),
         Paragraph(f'FATURA  #{order.id:05d}', right_style)],
        [Paragraph(COMPANY_SUB, sub_style),
         Paragraph(f'Tarih: {datetime.now().strftime("%d.%m.%Y")}', right_style)],
    ]
    header_table = Table(header_data, colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    story.append(header_table)
    story.append(Spacer(1, 0.5*cm))

    # Ayırıcı
    line_table = Table([['','']], colWidths=[17*cm, 0.1*cm])
    line_table.setStyle(TableStyle([('LINEABOVE',(0,0),(-1,0),1.5,colors.HexColor('#1e40af'))]))
    story.append(line_table)
    story.append(Spacer(1, 0.5*cm))

    # Müşteri
    story.append(Paragraph('Fatura Kesilen:', bold_style))
    story.append(Spacer(1, 0.2*cm))
    cust_rows = [[Paragraph(order.customer_name, bold_style)]]
    if order.customer_phone:
        cust_rows.append([Paragraph(f'Tel: {order.customer_phone}', normal)])
    if order.customer_email:
        cust_rows.append([Paragraph(f'E-posta: {order.customer_email}', normal)])
    cust_table = Table(cust_rows, colWidths=[17*cm])
    cust_table.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#f8fafc')),
        ('BOX',(0,0),(-1,-1),0.5,colors.HexColor('#e2e8f0')),
        ('LEFTPADDING',(0,0),(-1,-1),10),
        ('TOPPADDING',(0,0),(-1,-1),6),
        ('BOTTOMPADDING',(0,0),(-1,-1),6),
    ]))
    story.append(cust_table)
    story.append(Spacer(1, 0.7*cm))

    # Ürün tablosu
    table_data = [['#', 'Urun Adi', 'Adet', 'Birim Fiyat', 'Toplam']]
    total = 0
    for i, item in enumerate(order.items, 1):
        price = item.unit_price or (item.product.sale_price if item.product else 0)
        line_total = price * item.quantity
        total += line_total
        pname = item.product.name if item.product else '-'
        table_data.append([str(i), pname, str(int(item.quantity)), f'{price:,.2f} TL', f'{line_total:,.2f} TL'])

    kdv = total * settings.KDV_RATE
    genel = total + kdv
    kdv_pct = int(settings.KDV_RATE * 100)
    table_data.append(['', '', '', 'Ara Toplam:', f'{total:,.2f} TL'])
    table_data.append(['', '', '', f'KDV (%{kdv_pct}):', f'{kdv:,.2f} TL'])
    table_data.append(['', '', '', 'GENEL TOPLAM:', f'{genel:,.2f} TL'])

    n = len(table_data)
    items_table = Table(table_data, colWidths=[1*cm, 8*cm, 2*cm, 3.5*cm, 3.5*cm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#1e40af')),
        ('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('FONTNAME',(0,0),(-1,-1),FONT_NAME),
        ('FONTNAME',(0,0),(-1,0),FONT_BOLD),
        ('FONTNAME',(3,n-1),(-1,n-1),FONT_BOLD),
        ('FONTSIZE',(0,0),(-1,0),10),
        ('FONTSIZE',(0,1),(-1,-1),9),
        ('ALIGN',(0,0),(-1,0),'CENTER'),
        ('ROWBACKGROUNDS',(0,1),(-1,n-4),[colors.white,colors.HexColor('#f8fafc')]),
        ('ALIGN',(2,1),(-1,-1),'RIGHT'),
        ('GRID',(0,0),(-1,n-4),0.5,colors.HexColor('#e2e8f0')),
        ('LINEABOVE',(0,n-3),(-1,n-3),1,colors.HexColor('#e2e8f0')),
        ('BACKGROUND',(3,n-1),(-1,n-1),colors.HexColor('#eff6ff')),
        ('TOPPADDING',(0,0),(-1,-1),6),
        ('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 1*cm))

    if order.notes:
        story.append(Paragraph('Notlar:', bold_style))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(order.notes, normal))
        story.append(Spacer(1, 0.5*cm))

    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(f'Bu fatura {COMPANY_NAME} tarafindan otomatik olusturulmustur.', footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/{order_id}/pdf")
def download_invoice(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Siparis bulunamadi")
    pdf_buffer = generate_invoice_pdf(order, db)
    filename = f"fatura_{order_id:05d}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"})
