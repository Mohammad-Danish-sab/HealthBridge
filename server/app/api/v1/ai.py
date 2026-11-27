import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pypdf import PdfReader

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.medical_record import Prescription, LabReport
from app.models.appointment import Appointment
from app.models.doctor import DoctorProfile
from app.models.pharmacy import Complaint
from app.api.deps import get_current_user, RoleChecker
from app.ai.schemas import (
    AIChatRequest,
    AIChatResponse,
    ReportSummaryRequest,
    ReportSummaryResponse,
    PrescriptionExplainRequest,
    PrescriptionExplainResponse,
    HistorySummaryResponse,
    AdminComplaintSummaryRequest,
    AdminComplaintSummaryResponse,
)
from app.ai.services.assistant import handle_health_chat
from app.ai.services.summarizer import (
    summarize_medical_report,
    explain_prescription_record,
    summarize_patient_history,
    summarize_admin_complaint,
)
from app.services.audit import log_action

router = APIRouter(prefix="/ai", tags=["AI Assistance"])

allow_admin = RoleChecker([UserRole.ADMIN])

@router.post("/chat", response_model=AIChatResponse)
async def ai_health_assistant(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return await handle_health_chat(request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re_err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re_err))

@router.post("/reports/summarize", response_model=ReportSummaryResponse)
async def ai_summarize_report_text(
    request: ReportSummaryRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return await summarize_medical_report(request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re_err:
        raise HTTPException(status_code=503, detail=str(re_err))

@router.post("/reports/upload-summarize", response_model=ReportSummaryResponse)
async def ai_summarize_uploaded_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ["application/pdf", "text/plain"]:
        raise HTTPException(status_code=400, detail="Only PDF or plain text medical reports are supported.")

    raw_bytes = await file.read()
    if len(raw_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")

    extracted_text = ""
    if file.content_type == "application/pdf":
        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
            extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF could not be read.",
            ) from exc
    else:
        extracted_text = raw_bytes.decode("utf-8", errors="ignore")

    if len(extracted_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract readable text from uploaded document.")

    req = ReportSummaryRequest(report_text=extracted_text, report_type=file.filename or "Uploaded Report")
    try:
        return await summarize_medical_report(req)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve)) from ve
    except RuntimeError as re_err:
        raise HTTPException(status_code=503, detail=str(re_err)) from re_err

@router.post("/prescription/explain", response_model=PrescriptionExplainResponse)
async def ai_explain_prescription(
    request: PrescriptionExplainRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Prescription).where(Prescription.id == request.prescription_id))
    rx = res.scalars().first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")

    if current_user.role == UserRole.PATIENT and rx.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this prescription.")
    if current_user.role == UserRole.DOCTOR:
        doctor_profile = await db.scalar(
            select(DoctorProfile).where(
                DoctorProfile.user_id == current_user.id
            )
        )
        if doctor_profile is None or rx.doctor_id != doctor_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this prescription.")
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Administrators cannot access patient prescription content.")

    rx_dict = {
        "id": rx.id,
        "diagnosis": rx.diagnosis,
        "notes": rx.notes,
        "items": [
            {
                "medicine_name": item.medicine_name,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration": item.duration,
                "instructions": item.instructions,
            }
            for item in rx.items
        ],
    }
    return await explain_prescription_record(rx_dict)

@router.post("/history/summarize/{patient_id}", response_model=HistorySummaryResponse)
async def ai_summarize_patient_history(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if current_user.role == UserRole.DOCTOR:
        doctor_profile = await db.scalar(
            select(DoctorProfile).where(
                DoctorProfile.user_id == current_user.id
            )
        )
        if doctor_profile is None:
            raise HTTPException(status_code=403, detail="Access denied.")
        relationship = await db.scalar(
            select(Appointment.id)
            .where(
                Appointment.patient_id == patient_id,
                Appointment.doctor_id == doctor_profile.id,
            )
            .limit(1)
        )
        if relationship is None:
            raise HTTPException(status_code=403, detail="Access denied.")
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Administrators cannot access patient history.")

    rx_res = await db.execute(select(Prescription).where(Prescription.patient_id == patient_id))
    lab_res = await db.execute(select(LabReport).where(LabReport.patient_id == patient_id))
    appt_res = await db.execute(select(Appointment).where(Appointment.patient_id == patient_id))

    prescriptions = [{"date": str(r.created_at.date()), "diagnosis": r.diagnosis} for r in rx_res.scalars().all()]
    reports = [{"date": str(l.test_date), "test_name": l.test_name, "summary": l.summary} for l in lab_res.scalars().all()]
    appointments = [{"date": str(a.appointment_date), "status": a.status.value, "reason": a.reason} for a in appt_res.scalars().all()]

    return await summarize_patient_history(patient_id, prescriptions, reports, appointments)

@router.post("/admin/complaints/summarize", response_model=AdminComplaintSummaryResponse)
async def ai_summarize_complaint(
    request: AdminComplaintSummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    res = await db.execute(select(Complaint).where(Complaint.id == request.complaint_id))
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    try:
        summary = await summarize_admin_complaint(
            complaint.id,
            complaint.subject,
            complaint.description,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve)) from ve
    except RuntimeError as re_err:
        raise HTTPException(status_code=503, detail=str(re_err)) from re_err
    await log_action(
        db, current_user.id, "AI_SUMMARIZE_COMPLAINT", "Complaint", complaint.id, "Generated AI triage summary"
    )
    return summary