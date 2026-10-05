from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel
from app.models.appointment import AppointmentStatus
from app.schemas.user import UserResponse
from app.schemas.doctor import DoctorProfileResponse

class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    reason: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    cancellation_reason: Optional[str] = None

class TimeSlot(BaseModel):
    start_time: time
    end_time: time
    is_available: bool

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    patient: UserResponse
    doctor: DoctorProfileResponse

    class Config:
        from_attributes = True