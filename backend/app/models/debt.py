from sqlalchemy import Column, Integer, Float, String, Date, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class DebtStatus(str, enum.Enum):
    pending  = "pending"   # Ödenmedi
    partial  = "partial"   # Kısmi ödendi
    paid     = "paid"      # Ödendi
    overdue  = "overdue"   # Gecikmiş

class Debt(Base):
    __tablename__ = "debts"

    id           = Column(Integer, primary_key=True, index=True)
    creditor     = Column(String, nullable=False)   # Alacaklı (kime borçluyuz)
    description  = Column(String, nullable=True)    # Açıklama / ne için
    total_amount = Column(Float, nullable=False)
    paid_amount  = Column(Float, default=0)
    due_date     = Column(Date, nullable=False)
    paid_date    = Column(Date, nullable=True)
    status       = Column(String, default=DebtStatus.pending)
    notes        = Column(String, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
