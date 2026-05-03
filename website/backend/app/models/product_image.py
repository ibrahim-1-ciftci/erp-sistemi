from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("website_products.id", ondelete="CASCADE"), nullable=False)
    image = Column(String, nullable=False)
    order = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")
