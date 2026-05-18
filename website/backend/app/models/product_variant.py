from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id         = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("website_products.id", ondelete="CASCADE"), nullable=False)
    label      = Column(String, nullable=False)   # "1 Litre", "5 Litre", "20 Litre"
    price      = Column(Float, nullable=False)
    is_active  = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="variants")
