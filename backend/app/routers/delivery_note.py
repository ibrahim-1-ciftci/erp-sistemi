from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from io import BytesIO
from pydantic import BaseModel
import json, os
from app.core.database import get_db
from app.core.deps import get_current_user, log_activity
from app.models.delivery_note import DeliveryNote
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/delivery-notes", tags=["delivery-notes"])

# ── Pydantic ──────────────────────────────────────────────────────────────

class DeliveryNoteUpdate(BaseModel):
    delivery_address: Optional[str] = None
    driver_name:      Optional[str] = None
    driver_phone:     Optional[str] = None
    plate:            Optional[str] = None
    receiver_name:    Optional[str] = None
    receiver_title:   Optional[str] = None
    notes:            Optional[str] = None

# ── Helpers ───────────────────────────────────────────────────────────────

def build(dn: DeliveryNote) -> dict:
    items = []
    if dn.items_json:
        try:
            items = json.loads(dn.items_json)
        except Exception:
            items = []
    return {
        "id":               dn.id,
        "order_id":         dn.order_id,
        "note_number":      dn.note_number,
        "customer_name":    dn.customer_name,
        "customer_phone":   dn.customer_phone,
        "delivery_address": dn.delivery_address,
        "driver_name":      dn.driver_name,
        "driver_phone":     dn.driver_phone,
        "plate":            dn.plate,
        "receiver_name":    dn.receiver_name,
        "receiver_title":   dn.receiver_title,
        "shipped_at":       dn.shipped_at,
        "notes":            dn.notes,
        "items":            items,
        "created_at":       dn.created_at,
    }

def _register_font():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    candidates = [
        # Windows
        ("C:/Windows/Fonts/arial.ttf",   "C:/Windows/Fonts/arialbd.ttf"),
        ("C:/Windows/Fonts/calibri.ttf", "C:/Windows/Fonts/calibrib.ttf"),
        ("C:/Windows/Fonts/tahoma.ttf",  "C:/Windows/Fonts/tahomabd.ttf"),
        # Linux - Liberation
        ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
        # Linux - DejaVu
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for reg, bold in candidates:
        if os.path.exists(reg):
            name = os.path.splitext(os.path.basename(reg))[0]
            try:
                registered = pdfmetrics.getRegisteredFontNames()
                if name not in registered:
                    pdfmetrics.registerFont(TTFont(name, reg))
                bname = name + "-Bold"
                if os.path.exists(bold) and bname not in registered:
                    pdfmetrics.registerFont(TTFont(bname, bold))
                return name, bname if os.path.exists(bold) else name
            except Exception:
                continue
    return "Helvetica", "Helvetica-Bold"

# ── CRUD ──────────────────────────────────────────────────────────────────

@router.get("/order/{order_id}")
def get_by_order(order_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    dn = db.query(DeliveryNote).filter(DeliveryNote.order_id == order_id).first()
    if not dn:
        # Eski sevkiyatlı sipariş için otomatik fiş oluştur
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(404, "Sipariş bulunamadı")
        if order.status != "shipped":
            raise HTTPException(404, "Teslimat fişi bulunamadı")

        import json
        from app.routers.settings import get_setting
        from datetime import datetime as dt
        default_unit = get_setting(db, "default_unit") or "adet"
        year = (order.shipped_at or dt.utcnow()).strftime("%Y")
        count = db.query(DeliveryNote).count() + 1
        note_number = f"{year}-{count:05d}"
        dn_items = [
            {
                "product_name": item.product.name if item.product else "Ürün",
                "quantity": item.quantity,
                "unit": default_unit,
            }
            for item in order.items
        ]
        dn = DeliveryNote(
            order_id=order.id,
            note_number=note_number,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            shipped_at=order.shipped_at,
            items_json=json.dumps(dn_items, ensure_ascii=False),
        )
        db.add(dn)
        db.commit()
        db.refresh(dn)
    return build(dn)

@router.get("/{note_id}")
def get_note(note_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    dn = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not dn:
        raise HTTPException(404, "Teslimat fişi bulunamadı")
    return build(dn)

@router.put("/{note_id}")
def update_note(note_id: int, data: DeliveryNoteUpdate,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    dn = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not dn:
        raise HTTPException(404, "Teslimat fişi bulunamadı")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(dn, k, v)
    db.commit()
    db.refresh(dn)
    log_activity(db, current_user.id, "UPDATE", "DeliveryNote", note_id,
                 f"Teslimat fişi güncellendi: {dn.note_number}")
    return build(dn)

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    dn = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not dn:
        raise HTTPException(404, "Teslimat fişi bulunamadı")
    db.delete(dn)
    db.commit()
    return {"message": "Silindi"}

# ── PDF ───────────────────────────────────────────────────────────────────

@router.get("/{note_id}/pdf")
def download_pdf(note_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    dn = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not dn:
        raise HTTPException(404, "Teslimat fişi bulunamadı")

    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER
    from app.routers.settings import get_setting

    company_name = get_setting(db, "company_name") or "Laves Kimya"
    company_sub  = get_setting(db, "company_sub")  or "Uretim ve Isletme Yonetim Sistemi"
    FN, FB = _register_font()

    BLUE  = colors.HexColor('#1e40af')
    LIGHT = colors.HexColor('#f8fafc')
    BORD  = colors.HexColor('#e2e8f0')
    GREEN = colors.HexColor('#16a34a')

    def ps(name, fn=None, fb=False, size=9, color=None, align=None):
        from reportlab.lib.styles import ParagraphStyle as PS
        from reportlab.lib.enums import TA_LEFT
        kw = {"fontName": FB if fb else (fn or FN), "fontSize": size}
        if color: kw["textColor"] = color
        if align: kw["alignment"] = align
        return PS(f"dn_{name}", **kw)

    S_title = ps("title", fb=True, size=18, color=BLUE)
    S_sub   = ps("sub",   size=8,  color=colors.grey)
    S_right = ps("right", size=10, align=TA_RIGHT)
    S_bold  = ps("bold",  fb=True, size=10)
    S_norm  = ps("norm",  size=9)
    S_hdr   = ps("hdr",   fb=True, size=9,  color=colors.white)
    S_hdrr  = ps("hdrr",  fb=True, size=9,  color=colors.white, align=TA_RIGHT)
    S_ra    = ps("ra",    size=9,  align=TA_RIGHT)
    S_foot  = ps("foot",  size=7,  color=colors.grey, align=TA_CENTER)
    S_green = ps("green", fb=True, size=10, color=GREEN, align=TA_RIGHT)

    items = []
    if dn.items_json:
        try:
            items = json.loads(dn.items_json)
        except Exception:
            items = []

    shipped_str = dn.shipped_at.strftime("%d.%m.%Y %H:%M") if dn.shipped_at else datetime.now().strftime("%d.%m.%Y")

    story = []

    # Header
    hdr = Table([
        [Paragraph(company_name, S_title),
         Paragraph(f'IRSALIYE  #{dn.note_number}', S_right)],
        [Paragraph(company_sub, S_sub),
         Paragraph(f'Tarih: {shipped_str}', S_right)],
    ], colWidths=[10*cm, 7*cm])
    hdr.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.append(hdr)
    story.append(Spacer(1, 0.3*cm))

    # Ayırıcı çizgi
    ln = Table([['']], colWidths=[17*cm])
    ln.setStyle(TableStyle([('LINEABOVE',(0,0),(-1,0),1.5,BLUE)]))
    story.append(ln)
    story.append(Spacer(1, 0.4*cm))

    # Müşteri + Teslimat bilgileri
    info_rows = [
        [Paragraph(f'Musteri: <b>{dn.customer_name}</b>', S_norm),
         Paragraph(f'Siparis No: <b>#{dn.order_id}</b>', S_norm)],
    ]
    if dn.customer_phone:
        info_rows.append([Paragraph(f'Tel: {dn.customer_phone}', S_norm), Paragraph('', S_norm)])
    if dn.delivery_address:
        info_rows.append([Paragraph(f'Teslimat Adresi: {dn.delivery_address}', S_norm), Paragraph('', S_norm)])
    if dn.driver_name:
        info_rows.append([
            Paragraph(f'Surucu: {dn.driver_name}', S_norm),
            Paragraph(f'Plaka: {dn.plate or "-"}', S_norm)
        ])

    info_tbl = Table(info_rows, colWidths=[9*cm, 8*cm])
    info_tbl.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),LIGHT),
        ('BOX',(0,0),(-1,-1),0.5,BORD),
        ('LEFTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),5),
        ('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 0.5*cm))

    # Ürün tablosu
    tdata = [[
        Paragraph('#',        S_hdr),
        Paragraph('Urun Adi', S_hdr),
        Paragraph('Miktar',   S_hdrr),
        Paragraph('Birim',    S_hdrr),
    ]]
    total_qty = 0
    for i, item in enumerate(items, 1):
        qty = float(item.get('quantity', 0))
        total_qty += qty
        tdata.append([
            str(i),
            Paragraph(str(item.get('product_name', '')), S_norm),
            Paragraph(f"{qty:g}", S_ra),
            Paragraph(str(item.get('unit', '-')), S_ra),
        ])

    # Toplam satırı
    tdata.append(['', Paragraph('<b>TOPLAM</b>', S_bold),
                  Paragraph(f'<b>{total_qty:g}</b>', S_green), ''])

    n = len(tdata)
    prod_tbl = Table(tdata, colWidths=[1*cm, 10*cm, 3*cm, 3*cm])
    prod_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),  (-1,0),        BLUE),
        ('FONTNAME',      (0,0),  (-1,-1),        FN),
        ('ROWBACKGROUNDS',(0,1),  (-1,n-2),       [colors.white, LIGHT]),
        ('GRID',          (0,0),  (-1,n-2),       0.4, BORD),
        ('LINEABOVE',     (0,n-1),(-1,n-1),       1, BORD),
        ('TOPPADDING',    (0,0),  (-1,-1),        5),
        ('BOTTOMPADDING', (0,0),  (-1,-1),        5),
        ('LEFTPADDING',   (0,0),  (-1,-1),        5),
    ]))
    story.append(prod_tbl)
    story.append(Spacer(1, 0.6*cm))

    if dn.notes:
        story.append(Paragraph(f'Not: {dn.notes}', ps("small", size=8, color=colors.grey)))
        story.append(Spacer(1, 0.3*cm))

    # İmza alanları
    story.append(Spacer(1, 1.5*cm))
    receiver_label = dn.receiver_name or '_______________________'
    receiver_title = dn.receiver_title or ''
    sig_data = [
        [Paragraph('Teslim Eden', S_bold),   Paragraph('', S_norm),  Paragraph('Teslim Alan', S_bold)],
        [Paragraph('', S_norm),              Paragraph('', S_norm),  Paragraph('', S_norm)],
        [Paragraph('', S_norm),              Paragraph('', S_norm),  Paragraph('', S_norm)],
        [Paragraph('İmza: _______________', S_norm), Paragraph('', S_norm), Paragraph('İmza: _______________', S_norm)],
        [Paragraph(company_name, ps("cn", size=8, color=colors.grey)),
         Paragraph('', S_norm),
         Paragraph(f'{receiver_label}', ps("recv", fb=True, size=9))],
    ]
    if receiver_title:
        sig_data.append([
            Paragraph('', S_norm), Paragraph('', S_norm),
            Paragraph(receiver_title, ps("rtitle", size=8, color=colors.grey))
        ])

    sig_tbl = Table(sig_data, colWidths=[7*cm, 3*cm, 7*cm])
    sig_tbl.setStyle(TableStyle([
        ('TOPPADDING',    (0,0),(-1,-1), 4),
        ('BOTTOMPADDING', (0,0),(-1,-1), 4),
        ('LINEABOVE',     (0,3),  (0,3),  0.5, BORD),
        ('LINEABOVE',     (2,3),  (2,3),  0.5, BORD),
        ('ROWSPAN',       (1,1),  (1,4)),
    ]))
    story.append(sig_tbl)
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f'Bu belge {company_name} tarafindan otomatik olusturulmustur.', S_foot))

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    doc.build(story)
    buf.seek(0)

    fname = f"irsaliye_{dn.note_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"})
