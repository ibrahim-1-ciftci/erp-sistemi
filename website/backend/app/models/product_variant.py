from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id                = Column(Integer, primary_key=True, index=True)
    product_id        = Column(Integer, ForeignKey("website_products.id", ondelete="CASCADE"), nullable=False)
    label             = Column(String, nullable=False)
    price             = Column(Float, nullable=False)
    price_discounted  = Column(Float, nullable=True)
    discount_percent  = Column(Integer, nullable=True)
    price_note_tr     = Column(String, default="")
    price_note_en     = Column(String, default="")
    is_active         = Column(Boolean, default=True)
    sort_order        = Column(Integer, default=0)
    image_id          = Column(Integer, ForeignKey("product_images.id", ondelete="SET NULL"), nullable=True)

    product = relationship("Product", back_populates="variants")
    image   = relationship("ProductImage", foreign_keys=[image_id])
