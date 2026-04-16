from sqlalchemy import Column, Integer, Float, String, Date, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class FlowType(str, enum.Enum):
    income  = "income"   # Gelir
    expense = "expense"  # Gider

class PayMethod(str, enum.Enum):
    cash    = "cash"     # Nakit
    pos     = "pos"      # POS / Kart
    elden   = "elden"    # Elden (havale/EFT)
    other   = "other"    # Diğer

class CashFlow(Base):
    __tablename__ = "cashflows"

    id          = Column(Integer, primary_key=True, index=True)
    flow_date   = Column(Date, nullable=False)
    flow_type   = Column(String, nullable=False)   # income | expense
    pay_method  = Column(String, nullable=True)    # cash | pos | elden | other
    amount      = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    category    = Column(String, nullable=True)    # Serbest kategori
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
