from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sale_price = Column(Float, default=0)
    stock_quantity = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    boms = relationship("BOM", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    productions = relationship("Production", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
