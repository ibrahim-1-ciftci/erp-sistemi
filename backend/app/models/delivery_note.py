from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class DeliveryNote(Base):
    __tablename__ = "delivery_notes"

    id              = Column(Integer, primary_key=True, index=True)
    order_id        = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    note_number     = Column(String, nullable=False)          # İRS-2024-00001
    customer_name   = Column(String, nullable=False)
    customer_phone  = Column(String, nullable=True)
    delivery_address= Column(Text, nullable=True)             # Teslimat adresi
    driver_name     = Column(String, nullable=True)           # Sürücü adı
    driver_phone    = Column(String, nullable=True)           # Sürücü telefonu
    plate           = Column(String, nullable=True)           # Araç plakası
    receiver_name   = Column(String, nullable=True)           # Teslim alan kişi
    receiver_title  = Column(String, nullable=True)           # Teslim alan unvan
    shipped_at      = Column(DateTime(timezone=True), nullable=True)
    notes           = Column(Text, nullable=True)             # Ek notlar
    items_json      = Column(Text, nullable=True)             # JSON ürün listesi
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order")
