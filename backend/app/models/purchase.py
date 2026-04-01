from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class PurchaseStatus(str, enum.Enum):
    pending  = "pending"    # Sipariş verildi
    received = "received"   # Teslim alındı
    cancelled= "cancelled"  # İptal

class Purchase(Base):
    __tablename__ = "purchases"

    id              = Column(Integer, primary_key=True, index=True)
    material_id     = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    supplier_id     = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    quantity        = Column(Float, nullable=False)
    unit_price      = Column(Float, nullable=False)
    total_cost      = Column(Float, nullable=False)
    status          = Column(String, default=PurchaseStatus.pending)
    expected_date   = Column(Date, nullable=True)
    received_date   = Column(Date, nullable=True)
    notes           = Column(String, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("RawMaterial")
    supplier = relationship("Supplier")
