import enum
from datetime import datetime, date, time
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Date, Time, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.user import Base
from app.core.time import utc_now

class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    patient = relationship("User", foreign_keys=[patient_id], backref="patient_appointments")
    doctor = relationship("DoctorProfile", foreign_keys=[doctor_id], backref="doctor_appointments")
