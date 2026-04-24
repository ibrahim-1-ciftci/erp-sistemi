from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.production import ProductionStatus

class ProductionCreate(BaseModel):
    product_id: int
    quantity: float
    order_id: Optional[int] = None
    customer_id: Optional[int] = None   # özel reçete seçimi için
    notes: Optional[str] = None

class ProductionOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    order_id: Optional[int] = None
    quantity: float
    status: ProductionStatus
    total_cost: float
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProductionCostPreview(BaseModel):
    product_id: int
    product_name: str
    quantity: float
    total_cost: float
    unit_cost: float
    sale_price: float
    profit_per_unit: float
    total_profit: float
    materials: list
    can_produce: bool
    missing_materials: list
