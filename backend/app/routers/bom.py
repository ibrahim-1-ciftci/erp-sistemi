from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from io import BytesIO
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, check_permission, log_activity
from app.models.bom import BOM, BOMItem
from app.models.product import Product
from app.models.raw_material import RawMaterial
from app.models.user import User
from app.schemas.bom import BOMCreate, BOMUpdate, BOMOut, BOMItemOut

router = APIRouter(prefix="/bom", tags=["bom"])

def build_bom_out(bom: BOM) -> dict:
    items = []
    total_cost = 0
    for item in sorted(bom.items, key=lambda x: x.order):
        rm = item.raw_material
        cost = rm.purchase_price * item.quantity_required
        total_cost += cost
        items.append({
            "id": item.id,
            "raw_material_id": item.raw_material_id,
            "raw_material_name": rm.name,
            "raw_material_unit": rm.unit,
            "purchase_price": rm.purchase_price,
            "quantity_required": item.quantity_required,
            "order": item.order,
            "line_cost": cost
        })
    return {
        "id": bom.id,
        "product_id": bom.product_id,
        "product_name": bom.product.name if bom.product else None,
        "version": bom.version,
        "notes": bom.notes,
        "created_at": bom.created_at,
        "items": items,
        "total_cost": total_cost
    }

@router.get("", response_model=dict)
def list_boms(
    skip: int = 0, limit: int = 20,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("bom", "view"))
):
    query = db.query(BOM)
    if product_id:
        query = query.filter(BOM.product_id == product_id)
    total = query.count()
    boms = query.order_by(BOM.product_id, BOM.version.desc()).offset(skip).limit(limit).all()
    # Ürün adına göre alfabetik grupla
    result = [build_bom_out(b) for b in boms]
    result.sort(key=lambda x: (x['product_name'] or '').lower())
    return {"total": total, "items": result}

@router.post("", response_model=dict)
def create_bom(data: BOMCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    # Yeni versiyon numarası
    last = db.query(BOM).filter(BOM.product_id == data.product_id).order_by(BOM.version.desc()).first()
    version = (last.version + 1) if last else 1
    
    bom = BOM(product_id=data.product_id, version=version, notes=data.notes)
    db.add(bom)
    db.flush()
    
    for item_data in data.items:
        rm = db.query(RawMaterial).filter(RawMaterial.id == item_data.raw_material_id).first()
        if not rm:
            raise HTTPException(status_code=404, detail=f"Hammadde bulunamadı: {item_data.raw_material_id}")
        item = BOMItem(bom_id=bom.id, raw_material_id=item_data.raw_material_id,
                       quantity_required=item_data.quantity_required, order=item_data.order or 0)
        db.add(item)
    
    db.commit()
    db.refresh(bom)
    log_activity(db, current_user.id, "CREATE", "BOM", bom.id, f"Reçete oluşturuldu: {product.name} v{version}")
    return build_bom_out(bom)

@router.get("/product/{product_id}/latest", response_model=dict)
def get_latest_bom(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.product_id == product_id).order_by(BOM.version.desc()).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Bu ürün için reçete bulunamadı")
    return build_bom_out(bom)

@router.get("/{bom_id}", response_model=dict)
def get_bom(bom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    return build_bom_out(bom)

@router.put("/{bom_id}", response_model=dict)
def update_bom(bom_id: int, data: BOMUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    if data.notes is not None:
        bom.notes = data.notes
    if data.items is not None:
        for old_item in bom.items:
            db.delete(old_item)
        db.flush()
        for item_data in data.items:
            item = BOMItem(bom_id=bom.id, raw_material_id=item_data.raw_material_id,
                           quantity_required=item_data.quantity_required, order=item_data.order or 0)
            db.add(item)
    db.commit()
    db.refresh(bom)
    log_activity(db, current_user.id, "UPDATE", "BOM", bom_id)
    return build_bom_out(bom)

@router.delete("/{bom_id}")
def delete_bom(bom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    db.delete(bom)
    db.commit()
    log_activity(db, current_user.id, "DELETE", "BOM", bom_id)
    return {"message": "Reçete silindi"}


@router.get("/{bom_id}/pdf")
def download_bom_pdf(bom_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Tek bir reçeteyi PDF olarak indir"""
    bom = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    data = build_bom_out(bom)
    pdf = _generate_bom_pdf([data])
    filename = _safe_filename(f"recete_{data['product_name']}_v{data['version']}.pdf")
    return StreamingResponse(BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/product/{product_id}/pdf")
def download_product_boms_pdf(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Bir ürünün tüm versiyon reçetelerini tek PDF olarak indir"""
    boms = db.query(BOM).filter(BOM.product_id == product_id).order_by(BOM.version).all()
    if not boms:
        raise HTTPException(status_code=404, detail="Bu ürün için reçete bulunamadı")
    data_list = [build_bom_out(b) for b in boms]
    pdf = _generate_bom_pdf(data_list)
    product_name = data_list[0]['product_name'] or f"urun_{product_id}"
    filename = _safe_filename(f"recete_{product_name}_tum_versiyonlar.pdf")
    return StreamingResponse(BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"})


def _safe_filename(name: str) -> str:
    """Türkçe ve özel karakterleri ASCII'ye çevir"""
    tr_map = str.maketrans('çğıöşüÇĞİÖŞÜ', 'cgiosucgiosu')
    name = name.translate(tr_map)
    import re
    name = re.sub(r'[^\w\-.]', '_', name)
    return name


def _generate_bom_pdf(bom_list: list) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import os

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    BLUE = colors.HexColor('#1e40af')
    LIGHT_BLUE = colors.HexColor('#dbeafe')
    GRAY = colors.HexColor('#6b7280')
    LIGHT_GRAY = colors.HexColor('#f9fafb')

    title_style = ParagraphStyle('title', parent=styles['Normal'],
        fontSize=14, textColor=colors.white, alignment=TA_CENTER, fontName='Helvetica-Bold')
    h1_style = ParagraphStyle('h1', parent=styles['Normal'],
        fontSize=12, textColor=BLUE, fontName='Helvetica-Bold', spaceAfter=4)
    h2_style = ParagraphStyle('h2', parent=styles['Normal'],
        fontSize=10, textColor=GRAY, fontName='Helvetica', spaceAfter=2)
    note_style = ParagraphStyle('note', parent=styles['Normal'],
        fontSize=8, textColor=GRAY, fontName='Helvetica-Oblique')
    total_style = ParagraphStyle('total', parent=styles['Normal'],
        fontSize=10, textColor=BLUE, fontName='Helvetica-Bold', alignment=TA_RIGHT)

    story = []

    # Başlık kutusu
    header_data = [[Paragraph('LAVES KİMYA — ÜRÜN REÇETESİ (BOM)', title_style)]]
    header_table = Table(header_data, colWidths=[18*cm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BLUE),
        ('ROUNDEDCORNERS', [6]),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.4*cm))

    # Tarih
    story.append(Paragraph(f'Oluşturma Tarihi: {datetime.now().strftime("%d.%m.%Y %H:%M")}', h2_style))
    story.append(Spacer(1, 0.3*cm))

    for bom in bom_list:
        # Ürün başlığı
        story.append(Paragraph(f'{bom["product_name"]}  —  Versiyon {bom["version"]}', h1_style))
        if bom.get('notes'):
            story.append(Paragraph(f'Not: {bom["notes"]}', note_style))
        story.append(Spacer(1, 0.2*cm))

        # Tablo başlıkları
        col_widths = [1*cm, 6.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 3*cm]
        header_row = ['#', 'Hammadde', 'Miktar', 'Birim', 'Birim Fiyat', 'Satır Maliyeti']
        table_data = [header_row]

        for i, item in enumerate(bom['items'], 1):
            table_data.append([
                str(i),
                item['raw_material_name'],
                str(item['quantity_required']),
                item['raw_material_unit'],
                f"₺{item['purchase_price']:.2f}",
                f"₺{item['line_cost']:.2f}",
            ])

        # Toplam satırı
        table_data.append(['', '', '', '', 'TOPLAM MALİYET', f"₺{bom['total_cost']:.2f}"])

        t = Table(table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            # Başlık satırı
            ('BACKGROUND', (0,0), (-1,0), BLUE),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            # Veri satırları
            ('FONTNAME', (0,1), (-1,-2), 'Helvetica'),
            ('FONTSIZE', (0,1), (-1,-2), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, LIGHT_GRAY]),
            ('ALIGN', (2,1), (-1,-1), 'RIGHT'),
            ('TOPPADDING', (0,1), (-1,-2), 4),
            ('BOTTOMPADDING', (0,1), (-1,-2), 4),
            # Toplam satırı
            ('BACKGROUND', (0,-1), (-1,-1), LIGHT_BLUE),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,-1), (-1,-1), 9),
            ('TEXTCOLOR', (-1,-1), (-1,-1), BLUE),
            ('TOPPADDING', (0,-1), (-1,-1), 6),
            ('BOTTOMPADDING', (0,-1), (-1,-1), 6),
            # Genel
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.6*cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e5e7eb')))
        story.append(Spacer(1, 0.4*cm))

    doc.build(story)
    return buf.getvalue()
