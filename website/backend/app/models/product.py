from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..core.database import Base

class Product(Base):
    __tablename__ = "website_products"

    id = Column(Integer, primary_key=True, index=True)
    name_tr = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description_tr = Column(Text, default="")
    description_en = Column(Text, default="")
    details_tr = Column(Text, default="")
    details_en = Column(Text, default="")
    image = Column(String, default="")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)

    # Fiyat alanları
    price = Column(Float, nullable=True)              # Normal fiyat (₺)
    price_discounted = Column(Float, nullable=True)   # İndirimli fiyat (₺)
    discount_percent = Column(Integer, nullable=True) # İndirim yüzdesi (%)
    price_unit = Column(String, default="adet")       # adet, kg, lt, vs.
    min_order_qty = Column(Integer, default=1)        # Minimum sipariş adedi
    show_price = Column(Boolean, default=True)        # Fiyat sitede gösterilsin mi?
    price_note_tr = Column(String, default="")        # Fiyat notu (TR) — "KDV dahil", "Toplu fiyat için arayın" vs.
    price_note_en = Column(String, default="")        # Fiyat notu (EN)

    # Demo içeriği
    demo_youtube_url = Column(String, default="")     # YouTube video URL
    demo_before_image = Column(String, default="")    # Önce görseli
    demo_after_image  = Column(String, default="")    # Sonra görseli
    demo_title_tr     = Column(String, default="")    # Demo başlığı (TR)
    demo_title_en     = Column(String, default="")    # Demo başlığı (EN)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.order")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan", order_by="ProductVariant.sort_order")
