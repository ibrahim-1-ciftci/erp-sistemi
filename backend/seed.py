"""Örnek veri yükleyici"""
import sys
sys.path.append(".")

from app.core.database import SessionLocal, engine, Base
import app.models  # noqa
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial
from app.models.product import Product
from app.models.bom import BOM, BOMItem

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Admin kullanıcı
if not db.query(User).filter(User.username == "admin").first():
    db.add(User(username="admin", email="admin@erp.com", hashed_password=get_password_hash("admin123"), role=UserRole.admin))
    db.add(User(username="user1", email="user1@erp.com", hashed_password=get_password_hash("user123"), role=UserRole.user))

# Tedarikçiler
s1 = Supplier(name="Çelik A.Ş.", phone="0212-111-1111", email="info@celik.com", address="İstanbul")
s2 = Supplier(name="Plastik Ltd.", phone="0312-222-2222", email="info@plastik.com", address="Ankara")
db.add_all([s1, s2])
db.flush()

# Hammaddeler
m1 = RawMaterial(name="Çelik Levha", unit="kg", stock_quantity=500, min_stock_level=100, purchase_price=25.0, supplier_id=s1.id)
m2 = RawMaterial(name="Plastik Granül", unit="kg", stock_quantity=200, min_stock_level=50, purchase_price=15.0, supplier_id=s2.id)
m3 = RawMaterial(name="Vida M6", unit="adet", stock_quantity=1000, min_stock_level=200, purchase_price=0.5, supplier_id=s1.id)
m4 = RawMaterial(name="Boya (Kırmızı)", unit="litre", stock_quantity=30, min_stock_level=10, purchase_price=40.0, supplier_id=s2.id)
db.add_all([m1, m2, m3, m4])
db.flush()

# Ürünler
p1 = Product(name="Metal Kutu", sale_price=350.0)
p2 = Product(name="Plastik Kapak", sale_price=120.0)
db.add_all([p1, p2])
db.flush()

# BOM
bom1 = BOM(product_id=p1.id, version=1, notes="Standart metal kutu reçetesi")
db.add(bom1)
db.flush()
db.add_all([
    BOMItem(bom_id=bom1.id, raw_material_id=m1.id, quantity_required=2.5),
    BOMItem(bom_id=bom1.id, raw_material_id=m3.id, quantity_required=8),
    BOMItem(bom_id=bom1.id, raw_material_id=m4.id, quantity_required=0.2),
])

bom2 = BOM(product_id=p2.id, version=1, notes="Plastik kapak reçetesi")
db.add(bom2)
db.flush()
db.add_all([
    BOMItem(bom_id=bom2.id, raw_material_id=m2.id, quantity_required=0.8),
    BOMItem(bom_id=bom2.id, raw_material_id=m3.id, quantity_required=4),
])

db.commit()
print("✅ Örnek veriler yüklendi!")
print("Admin: admin / admin123")
print("Kullanıcı: user1 / user123")
db.close()
