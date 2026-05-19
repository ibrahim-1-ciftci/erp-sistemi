from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class TradeItem(Base):
    """Ticaret stok kalemi — alınıp komisyonla satılan ürünler"""
    __tablename__ = "trade_items"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)       # Ürün adı
    unit         = Column(String, default="adet")       # Birim
    stock        = Column(Float, default=0)             # Mevcut stok
    notes        = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class TradePurchase(Base):
    """Alış kaydı — stok artar"""
    __tablename__ = "trade_purchases"

    id           = Column(Integer, primary_key=True, index=True)
    trade_item_id= Column(Integer, ForeignKey("trade_items.id"), nullable=False)
    supplier     = Column(String, nullable=False)       # Tedarikçi adı
    quantity     = Column(Float, nullable=False)        # Miktar
    unit_price   = Column(Float, nullable=False)        # Birim alış fiyatı
    total_cost   = Column(Float, nullable=False)        # Toplam maliyet
    purchase_date= Column(Date, nullable=False)
    notes        = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class TradeSale(Base):
    """Satış kaydı — stok düşer, komisyon hesaplanır"""
    __tablename__ = "trade_sales"

    id              = Column(Integer, primary_key=True, index=True)
    trade_item_id   = Column(Integer, ForeignKey("trade_items.id"), nullable=False)
    customer        = Column(String, nullable=False)    # Müşteri adı
    quantity        = Column(Float, nullable=False)     # Miktar
    unit_price      = Column(Float, nullable=False)     # Birim satış fiyatı
    total_revenue   = Column(Float, nullable=False)     # Toplam satış tutarı
    commission_rate = Column(Float, default=0)          # Komisyon oranı (%)
    commission_amount= Column(Float, default=0)         # Komisyon tutarı
    sale_date       = Column(Date, nullable=False)
    notes           = Column(Text, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
