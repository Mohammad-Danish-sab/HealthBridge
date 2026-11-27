from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.pharmacy import ComplaintStatus, OrderStatus
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
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class OrderItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medicine_id: int
    quantity: int
    unit_price: float
    medicine: MedicineResponse


class OrderCreate(BaseModel):
    prescription_id: Optional[int] = None
    shipping_address: str
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    prescription_id: Optional[int] = None
    total_amount: float
    shipping_address: str
    status: OrderStatus
    created_at: datetime
    patient: UserResponse
    items: List[OrderItemResponse]


class PlatformStats(BaseModel):
    total_patients: int
    total_doctors: int
    verified_doctors: int
    total_appointments: int
    total_orders: int
    total_revenue: float


class ComplaintCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=4000)


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject: str
    description: str
    status: ComplaintStatus
    resolution_notes: Optional[str] = None
    created_at: datetime
