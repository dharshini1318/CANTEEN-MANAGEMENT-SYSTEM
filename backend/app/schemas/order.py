from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemCreate(BaseModel):
    id: str
    quantity: int

class OrderCreate(BaseModel):
    customerName: str
    paymentMethod: str
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: str
    name: str
    quantity: int
    price: int

class OrderResponse(BaseModel):
    token: str
    orderNumber: str
    pickupCode: str
    customerName: str
    paymentMethod: str
    items: List[OrderItemResponse]
    subtotal: int
    paymentStatus: str
    orderStatus: str
    createdAt: datetime
    expiresAt: Optional[datetime] = None
    paidAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    paymentStatus: Optional[str] = None
    orderStatus: Optional[str] = None
