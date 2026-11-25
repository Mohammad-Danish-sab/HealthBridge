import json
from typing import List, Dict, Any
from app.ai.client import llm_client
from app.ai.safety import MEDICAL_DISCLAIMER, sanitize_user_input
from app.ai.prompts.templates import (
    REPORT_SUMMARIZER_SYSTEM_PROMPT,
    PRESCRIPTION_EXPLAINER_SYSTEM_PROMPT,
    HISTORY_SUMMARIZER_SYSTEM_PROMPT,
    ADMIN_COMPLAINT_SYSTEM_PROMPT,
)
from app.ai.schemas import (
    ReportSummaryRequest,
    ReportSummaryResponse,
    PrescriptionExplainResponse,
    HistorySummaryResponse,
    AdminComplaintSummaryResponse,
)

def _string_list(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]

def _string_dict_list(value: Any) -> List[Dict[str, str]]:
    if not isinstance(value, list):
        return []
    return [
        {str(key): str(item[key]) for key in item if isinstance(key, str)}
        for item in value
        if isinstance(item, dict)
    ]

async def summarize_medical_report(req: ReportSummaryRequest) -> ReportSummaryResponse:
    cleaned_text = sanitize_user_input(req.report_text)
    prompt_input = f"Report Type Hint: {req.report_type}\n\nDocument Text:\n{cleaned_text}"

    parsed = await llm_client.generate_json(
        system_prompt=REPORT_SUMMARIZER_SYSTEM_PROMPT,
        user_content=prompt_input,
    )

    return ReportSummaryResponse(
        report_type=parsed.get("report_type", req.report_type or "Medical Report"),
        report_date=parsed.get("report_date"),
        key_observations=_string_list(parsed.get("key_observations")),
        reported_values=_string_dict_list(parsed.get("reported_values")),
        terms_to_clarify=_string_list(parsed.get("terms_to_clarify")),
        questions_for_doctor=_string_list(parsed.get("questions_for_doctor")),
        disclaimer=MEDICAL_DISCLAIMER,
    )

async def explain_prescription_record(prescription_data: Dict[str, Any]) -> PrescriptionExplainResponse:
    serialized = json.dumps(prescription_data, default=str)
    parsed = await llm_client.generate_json(
        system_prompt=PRESCRIPTION_EXPLAINER_SYSTEM_PROMPT,
        user_content=f"Authorized Doctor Prescription:\n{serialized}",
    )

    return PrescriptionExplainResponse(
        prescription_id=prescription_data["id"],
        plain_language_summary=parsed.get("plain_language_summary", ""),
        medicine_breakdowns=_string_dict_list(parsed.get("medicine_breakdowns")),
        questions_for_doctor=_string_list(parsed.get("questions_for_doctor")),
        disclaimer=MEDICAL_DISCLAIMER,
    )

async def summarize_patient_history(
    patient_id: int,
    prescriptions: List[Dict[str, Any]],
    lab_reports: List[Dict[str, Any]],
    appointments: List[Dict[str, Any]],
) -> HistorySummaryResponse:
    context_payload = {
        "prescriptions": prescriptions,
        "lab_reports": lab_reports,
        "appointments": appointments,
    }
    parsed = await llm_client.generate_json(
        system_prompt=HISTORY_SUMMARIZER_SYSTEM_PROMPT,
        user_content=json.dumps(context_payload, default=str),
    )

    return HistorySummaryResponse(
        patient_id=patient_id,
        stored_facts_count={
            "prescriptions": len(prescriptions),
            "lab_reports": len(lab_reports),
            "appointments": len(appointments),
        },
        ai_narrative_summary=parsed.get("ai_narrative_summary", ""),
        important_timeline_events=_string_list(parsed.get("important_timeline_events")),
        disclaimer=MEDICAL_DISCLAIMER,
    )

async def summarize_admin_complaint(complaint_id: int, subject: str, description: str) -> AdminComplaintSummaryResponse:
    payload = f"Subject: {subject}\nDescription: {description}"
    parsed = await llm_client.generate_json(
        system_prompt=ADMIN_COMPLAINT_SYSTEM_PROMPT,
        user_content=payload,
    )

    return AdminComplaintSummaryResponse(
        complaint_id=complaint_id,
        main_issue=parsed.get("main_issue", subject),
        category=parsed.get("category", "General Support"),
        important_details=_string_list(parsed.get("important_details")),
        requested_resolution=parsed.get("requested_resolution", "Review requested"),
        draft_response=parsed.get("draft_response", ""),
    )