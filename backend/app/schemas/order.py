from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    product_id: int
    quantity: float
    unit_price: Optional[float] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemOut(OrderItemBase):
    id: int
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None

class OrderOut(BaseModel):
    id: int
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    status: OrderStatus
    notes: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []
    total_value: Optional[float] = None

    class Config:
        from_attributes = True
