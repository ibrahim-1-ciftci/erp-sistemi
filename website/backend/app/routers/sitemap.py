from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.product import Product
from ..models.category import Category

router = APIRouter(tags=["sitemap"])

@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)):
    base = "https://laveskimya.com"

    products = db.query(Product).filter(Product.is_active == True).all()
    categories = db.query(Category).all()

    urls = [
        f"<url><loc>{base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>",
        f"<url><loc>{base}/urunler</loc><changefreq>daily</changefreq><priority>0.9</priority></url>",
        f"<url><loc>{base}/hakkimizda</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>",
        f"<url><loc>{base}/iletisim</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>",
        f"<url><loc>{base}/gizlilik-politikasi</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>",
        f"<url><loc>{base}/mesafeli-satis-sozlesmesi</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>",
        f"<url><loc>{base}/iade-iptal</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>",
        f"<url><loc>{base}/teslimat</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>",
    ]

    for c in categories:
        urls.append(f"<url><loc>{base}/urunler?cat={c.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>")

    for p in products:
        urls.append(f"<url><loc>{base}/urun/{p.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>")

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "\n".join(urls)
    xml += "\n</urlset>"

    return Response(content=xml, media_type="application/xml")
