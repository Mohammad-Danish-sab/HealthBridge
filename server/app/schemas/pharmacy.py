from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.pharmacy import OrderStatus
from app.schemas.user import UserResponse

class MedicineBase(BaseModel):
    name: str
    manufacturer: str
    description: Optional[str] = None
    unit_price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    requires_prescription: bool = False

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    medicine_id: int
    quantity: int
    unit_price: float
    medicine: MedicineResponse

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    prescription_id: Optional[int] = None
    shipping_address: str
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderResponse(BaseModel):
    id: int
    patient_id: int
    prescription_id: Optional[int] = None
    total_amount: float
    shipping_address: str
    status: OrderStatus
    created_at: datetime
    patient: UserResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class PlatformStats(BaseModel):
    total_patients: int
    total_doctors: int
    verified_doctors: int
    total_appointments: int
    total_orders: int
    total_revenue: float