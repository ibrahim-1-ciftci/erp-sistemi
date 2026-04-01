from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class MovementType(str, enum.Enum):
    in_ = "in"
    out = "out"

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("RawMaterial", back_populates="stock_movements")
    product = relationship("Product", back_populates="stock_movements")
