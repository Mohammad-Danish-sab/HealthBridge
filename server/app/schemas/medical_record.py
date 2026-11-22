from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.doctor import DoctorProfileResponse

class PrescriptionItemBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItemResponse(PrescriptionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

class PrescriptionCreate(BaseModel):
    appointment_id: int
    diagnosis: str
    notes: Optional[str] = None
    items: List[PrescriptionItemCreate]

class PrescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    patient_id: int
    doctor_id: int
    diagnosis: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[PrescriptionItemResponse]
    doctor: DoctorProfileResponse


class LabReportCreate(BaseModel):
    patient_id: int
    test_name: str
    report_url: str
    summary: Optional[str] = None
    test_date: date

class LabReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    test_name: str
    report_url: str
    summary: Optional[str] = None
    test_date: date
    created_at: datetime
