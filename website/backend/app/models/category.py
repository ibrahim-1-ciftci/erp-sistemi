from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name_tr = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    order = Column(Integer, default=0)

    products = relationship("Product", back_populates="category")
