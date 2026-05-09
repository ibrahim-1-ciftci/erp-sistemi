from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.sql import func
from ..core.database import Base

class WebOrder(Base):
    __tablename__ = "web_orders"

    id = Column(Integer, primary_key=True, index=True)
    # Müşteri bilgileri
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, default="")
    customer_address = Column(Text, default="")
    customer_city = Column(String, default="")
    note = Column(Text, default="")
    # Sipariş
    items = Column(JSON, nullable=False)  # [{product_id, name, qty, price}]
    total = Column(Float, default=0)
    payment_method = Column(String, default="transfer")  # transfer | card
    status = Column(String, default="pending")  # pending | confirmed | shipped | delivered | cancelled
    lang = Column(String, default="tr")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
