from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class Product(Base):
    __tablename__ = "website_products"

    id = Column(Integer, primary_key=True, index=True)
    name_tr = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description_tr = Column(Text, default="")
    description_en = Column(Text, default="")
    image = Column(String, default="")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)

    category = relationship("Category", back_populates="products")
