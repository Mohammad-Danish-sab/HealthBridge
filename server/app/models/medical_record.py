import enum
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Date, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from app.models.user import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False)
    diagnosis = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    appointment = relationship("Appointment", backref="prescription")
    patient = relationship("User", foreign_keys=[patient_id], backref="patient_prescriptions")
    doctor = relationship("DoctorProfile", foreign_keys=[doctor_id], backref="doctor_prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)         
    frequency = Column(String, nullable=False)      
    duration = Column(String, nullable=False)       
    instructions = Column(String, nullable=True)    

    prescription = relationship("Prescription", back_populates="items")

class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=True)
    test_name = Column(String, nullable=False)
    report_url = Column(String, nullable=False)      
    summary = Column(Text, nullable=True)
    test_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("User", foreign_keys=[patient_id], backref="patient_lab_reports")
    doctor = relationship("DoctorProfile", foreign_keys=[doctor_id], backref="doctor_lab_reports")