from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BOMItemBase(BaseModel):
    raw_material_id: int
    quantity_required: float

class BOMItemCreate(BOMItemBase):
    pass

class BOMItemOut(BOMItemBase):
    id: int
    raw_material_name: Optional[str] = None
    raw_material_unit: Optional[str] = None
    purchase_price: Optional[float] = None

    class Config:
        from_attributes = True

class BOMCreate(BaseModel):
    product_id: int
    notes: Optional[str] = None
    items: List[BOMItemCreate]

class BOMUpdate(BaseModel):
    notes: Optional[str] = None
    items: Optional[List[BOMItemCreate]] = None

class BOMOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    version: int
    notes: Optional[str] = None
    created_at: datetime
    items: List[BOMItemOut] = []
    total_cost: Optional[float] = None

    class Config:
        from_attributes = True
