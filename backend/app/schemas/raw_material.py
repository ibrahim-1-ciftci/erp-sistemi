from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RawMaterialBase(BaseModel):
    name: str
    unit: str
    stock_quantity: float = 0
    min_stock_level: float = 0
    purchase_price: float = 0
    supplier_id: Optional[int] = None

class RawMaterialCreate(RawMaterialBase):
    pass

class RawMaterialUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    stock_quantity: Optional[float] = None
    min_stock_level: Optional[float] = None
    purchase_price: Optional[float] = None
    supplier_id: Optional[int] = None

class StockAdjust(BaseModel):
    quantity: float
    description: Optional[str] = None

class RawMaterialOut(RawMaterialBase):
    id: int
    created_at: datetime
    is_low_stock: bool = False
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True
