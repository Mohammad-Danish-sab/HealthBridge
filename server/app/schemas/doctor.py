from datetime import time

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.doctor import DayOfWeek
from app.schemas.user import UserResponse


class DoctorProfileCreate(BaseModel):
    specialization: str = Field(min_length=1, max_length=150)
    license_number: str = Field(min_length=1, max_length=100)
    experience_years: int = Field(default=0, ge=0)
    bio: str | None = None
    consultation_fee: float = Field(default=0, ge=0)


class DoctorProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    specialization: str
    license_number: str
    experience_years: int
    bio: str | None
    consultation_fee: float
    is_approved: bool
    user: UserResponse


class AvailabilityItem(BaseModel):
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    slot_duration_minutes: int = Field(default=30, ge=5, le=240)

    @model_validator(mode="after")
    def validate_interval(self) -> "AvailabilityItem":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be later than start_time")
        return self
