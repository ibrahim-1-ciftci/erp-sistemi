from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class PaymentStatus(str, enum.Enum):
    pending = "pending"       # Bekliyor
    paid = "paid"             # Ödendi
    overdue = "overdue"       # Gecikmiş
    partial = "partial"       # Kısmi ödeme

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    customer_name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0)
    due_date = Column(Date, nullable=False)        # Vade tarihi
    paid_date = Column(Date, nullable=True)        # Ödeme tarihi
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    notes = Column(String, nullable=True)
    description = Column(String, nullable=True)
    items_json = Column(String, nullable=True)   # JSON: [{product_name, quantity, unit, unit_price}]
    order_date = Column(Date, nullable=True)      # Sipariş/gönderim tarihi
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order")
