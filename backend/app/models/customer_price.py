from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class CustomerPrice(Base):
    __tablename__ = "customer_prices"
    __table_args__ = (UniqueConstraint("customer_id", "product_id"),)

    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=False)
    price       = Column(Float, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer")
    product  = relationship("Product")
