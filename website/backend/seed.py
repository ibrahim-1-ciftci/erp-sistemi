"""
Veritabanına başlangıç verilerini yükler.
Çalıştır: python seed.py
"""
import sys
sys.path.append(".")

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.admin import Admin
from app.models.category import Category
from app.models.product import Product
from app.models.setting import SiteSetting

db = SessionLocal()

# Admin
if not db.query(Admin).filter(Admin.username == "admin").first():
    db.add(Admin(username="admin", hashed_password=hash_password("laves2024")))
    print("Admin oluşturuldu: admin / laves2024")

# Kategoriler
categories = [
    {"name_tr": "Köpük & Sabun", "name_en": "Foam & Soap", "slug": "kopuk-sabun", "order": 1},
    {"name_tr": "Cila & Parlatıcı", "name_en": "Polish & Shine", "slug": "cila-parlatici", "order": 2},
    {"name_tr": "Temizlik", "name_en": "Cleaning", "slug": "temizlik", "order": 3},
    {"name_tr": "Bakım", "name_en": "Care", "slug": "bakim", "order": 4},
    {"name_tr": "Diğer", "name_en": "Other", "slug": "diger", "order": 5},
]
cat_map = {}
for c in categories:
    existing = db.query(Category).filter(Category.slug == c["slug"]).first()
    if not existing:
        obj = Category(**c)
        db.add(obj)
        db.flush()
        cat_map[c["slug"]] = obj.id
    else:
        cat_map[c["slug"]] = existing.id

# Ürünler
products = [
    # Köpük & Sabun
    ("Beyaz Köpük 1. Kalite", "White Foam 1st Quality", "kopuk-sabun"),
    ("Beyaz Köpük 2. Kalite", "White Foam 2nd Quality", "kopuk-sabun"),
    ("Beyaz Köpük 3. Kalite", "White Foam 3rd Quality", "kopuk-sabun"),
    ("Pembe Köpük", "Pink Foam", "kopuk-sabun"),
    ("Köpük Sabun", "Foam Soap", "kopuk-sabun"),
    ("Sıvı Sabun", "Liquid Soap", "kopuk-sabun"),
    # Cila & Parlatıcı
    ("Cila Özü", "Polish Essence", "cila-parlatici"),
    ("Hızlı Cila", "Quick Polish", "cila-parlatici"),
    ("Lastik Parlatıcısı (Düşük K.)", "Tire Shine (Low Viscosity)", "cila-parlatici"),
    ("Lastik Parlatıcısı (Jel)", "Tire Shine (Gel)", "cila-parlatici"),
    ("Lastik Parlatıcısı (Sıvı)", "Tire Shine (Liquid)", "cila-parlatici"),
    ("Torpido Parlatıcısı", "Dashboard Polish", "cila-parlatici"),
    ("Süt Silikon", "Milk Silicone", "cila-parlatici"),
    # Temizlik
    ("Böcek Temizleme", "Bug Remover", "temizlik"),
    ("Detay Temizlik", "Detail Cleaner", "temizlik"),
    ("Demir Tozu", "Iron Powder Remover", "temizlik"),
    ("Etiket Sökücü", "Label Remover", "temizlik"),
    ("Far Temizleme", "Headlight Cleaner", "temizlik"),
    ("Kireç Sökücü", "Lime Remover", "temizlik"),
    ("Leke Çıkarıcı", "Stain Remover", "temizlik"),
    ("Motor Yağı Çözücüsü", "Engine Oil Solvent", "temizlik"),
    ("Yüzey Temizleyici (Ucuz)", "Surface Cleaner (Economy)", "temizlik"),
    ("Zift Temizleme", "Tar Remover", "temizlik"),
    # Bakım
    ("Cam Su", "Windshield Washer Fluid", "bakim"),
    ("Silikonlu Cam Su", "Silicone Windshield Fluid", "bakim"),
    ("Deri Bakım Kremi", "Leather Care Cream", "bakim"),
    ("El Temizleme Kremi (Sanayi Tipi)", "Hand Cleaner (Industrial)", "bakim"),
    ("Jant", "Rim Cleaner", "bakim"),
    ("Tampon Yenileyici", "Bumper Restorer", "bakim"),
    # Diğer
    ("Bidon 5 L", "5L Container", "diger"),
    ("Oto Parfüm", "Car Perfume", "diger"),
]

for name_tr, name_en, cat_slug in products:
    exists = db.query(Product).filter(Product.name_tr == name_tr).first()
    if not exists:
        db.add(Product(
            name_tr=name_tr, name_en=name_en,
            description_tr="", description_en="",
            category_id=cat_map.get(cat_slug),
            is_active=True, order=0
        ))

# Site ayarları
defaults = {
    "company_name": "Laves Kimya",
    "company_name_en": "Laves Chemistry",
    "phone": "+90 XXX XXX XX XX",
    "email": "info@laves.com",
    "address": "İstanbul, Türkiye",
    "whatsapp": "+90XXXXXXXXXX",
    "about_tr": "Laves Kimya, oto bakım ürünleri alanında kaliteli ve güvenilir çözümler sunan bir üretim firmasıdır.",
    "about_en": "Laves Chemistry is a manufacturing company offering quality and reliable solutions in automotive care products.",
}
for key, value in defaults.items():
    if not db.query(SiteSetting).filter(SiteSetting.key == key).first():
        db.add(SiteSetting(key=key, value=value))

db.commit()
db.close()
print("Seed tamamlandı.")
