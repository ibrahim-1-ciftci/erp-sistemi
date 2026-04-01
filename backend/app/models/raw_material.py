from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)  # kg, adet, metre vb.
    stock_quantity = Column(Float, default=0)
    min_stock_level = Column(Float, default=0)
    purchase_price = Column(Float, default=0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    supplier = relationship("Supplier", back_populates="raw_materials")
    bom_items = relationship("BOMItem", back_populates="raw_material")
    stock_movements = relationship("StockMovement", back_populates="material")
