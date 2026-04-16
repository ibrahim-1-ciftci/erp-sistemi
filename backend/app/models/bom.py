from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class BOM(Base):
    __tablename__ = "boms"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    version = Column(Integer, default=1)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="boms")
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")

class BOMItem(Base):
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity_required = Column(Float, nullable=False)
    order = Column(Integer, default=0, name="sort_order")  # Sıra numarası

    bom = relationship("BOM", back_populates="items")
    raw_material = relationship("RawMaterial", back_populates="bom_items")
