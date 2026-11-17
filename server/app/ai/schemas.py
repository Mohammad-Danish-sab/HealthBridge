from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChatTurn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[ChatTurn] = Field(default_factory=list, max_length=10)

class AIChatResponse(BaseModel):
    reply: str
    is_emergency: bool = False
    disclaimer: str

class ReportSummaryRequest(BaseModel):
    report_text: str = Field(..., min_length=10, max_length=15000)
    report_type: Optional[str] = "Lab Report"

class ReportSummaryResponse(BaseModel):
    report_type: str
    report_date: Optional[str] = None
    key_observations: List[str]
    reported_values: List[Dict[str, str]]
    terms_to_clarify: List[str]
    questions_for_doctor: List[str]
    disclaimer: str

class PrescriptionExplainRequest(BaseModel):
    prescription_id: int

class PrescriptionExplainResponse(BaseModel):
    prescription_id: int
    plain_language_summary: str
    medicine_breakdowns: List[Dict[str, str]]
    questions_for_doctor: List[str]
    disclaimer: str

class HistorySummaryResponse(BaseModel):
    patient_id: int
    stored_facts_count: Dict[str, int]
    ai_narrative_summary: str
    important_timeline_events: List[str]
    disclaimer: str

class AdminComplaintSummaryRequest(BaseModel):
    complaint_id: int

class AdminComplaintSummaryResponse(BaseModel):
    complaint_id: int
    main_issue: str
    category: str
    important_details: List[str]
    requested_resolution: str
    draft_response: str