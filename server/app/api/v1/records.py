from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor import DoctorProfile
from app.models.appointment import Appointment, AppointmentStatus
from app.models.medical_record import Prescription, PrescriptionItem, LabReport
from app.schemas.medical_record import (
    PrescriptionCreate,
    PrescriptionResponse,
    LabReportCreate,
    LabReportResponse
)
from app.api.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/records", tags=["Medical Records"])

allow_doctor = RoleChecker([UserRole.DOCTOR])
allow_all = RoleChecker([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN])

@router.post("/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_in: PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_doctor)
):
    doc_res = await db.execute(select(DoctorProfile).where(DoctorProfile.user_id == current_user.id))
    doctor = doc_res.scalars().first()
    if not doctor:
        raise HTTPException(status_code=400, detail="Doctor profile missing.")

    appt_res = await db.execute(select(Appointment).where(Appointment.id == prescription_in.appointment_id))
    appointment = appt_res.scalars().first()
    if not appointment or appointment.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Not authorized to issue prescription for this appointment.")

    existing_res = await db.execute(select(Prescription).where(Prescription.appointment_id == appointment.id))
    if existing_res.scalars().first():
        raise HTTPException(status_code=400, detail="Prescription already issued for this appointment.")

    prescription = Prescription(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        doctor_id=doctor.id,
        diagnosis=prescription_in.diagnosis,
        notes=prescription_in.notes
    )
    db.add(prescription)
    await db.flush()

    for item in prescription_in.items:
        db.add(PrescriptionItem(
            prescription_id=prescription.id,
            medicine_name=item.medicine_name,
            dosage=item.dosage,
            frequency=item.frequency,
            duration=item.duration,
            instructions=item.instructions
        ))

    appointment.status = AppointmentStatus.COMPLETED

    await db.commit()

    result = await db.execute(select(Prescription).where(Prescription.id == prescription.id))
    return result.scalars().first()

@router.get("/prescriptions/patient/{patient_id}", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    result = await db.execute(
        select(Prescription)
        .where(Prescription.patient_id == patient_id)
        .order_by(Prescription.created_at.desc())
    )
    return result.scalars().all()

@router.post("/lab-reports", response_model=LabReportResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_report(
    report_in: LabReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    doctor_id = None
    if current_user.role == UserRole.DOCTOR:
        doc_res = await db.execute(select(DoctorProfile).where(DoctorProfile.user_id == current_user.id))
        doc = doc_res.scalars().first()
        if doc:
            doctor_id = doc.id

    report = LabReport(
        patient_id=report_in.patient_id,
        doctor_id=doctor_id,
        test_name=report_in.test_name,
        report_url=report_in.report_url,
        summary=report_in.summary,
        test_date=report_in.test_date
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@router.get("/lab-reports/patient/{patient_id}", response_model=List[LabReportResponse])
async def get_patient_lab_reports(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    result = await db.execute(
        select(LabReport)
        .where(LabReport.patient_id == patient_id)
        .order_by(LabReport.test_date.desc())
    )
    return result.scalars().all()