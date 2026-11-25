from app.ai.client import llm_client
from app.ai.safety import (
    MEDICAL_DISCLAIMER,
    check_emergency_escalation,
    sanitize_user_input,
)
from app.ai.prompts.templates import HEALTH_ASSISTANT_SYSTEM_PROMPT
from app.ai.schemas import AIChatRequest, AIChatResponse

async def handle_health_chat(request: AIChatRequest) -> AIChatResponse:
    cleaned_message = sanitize_user_input(request.message)

    is_emergency, emergency_msg = check_emergency_escalation(cleaned_message)
    if is_emergency:
        return AIChatResponse(
            reply=emergency_msg,
            is_emergency=True,
            disclaimer=MEDICAL_DISCLAIMER,
        )

    conversation = []
    for turn in request.history:
        cleaned_turn = sanitize_user_input(turn.content)
        conversation.append({"role": turn.role, "content": cleaned_turn})
    conversation.append({"role": "user", "content": cleaned_message})

    reply_text = await llm_client.generate_text(
        system_prompt=HEALTH_ASSISTANT_SYSTEM_PROMPT,
        messages=conversation,
    )

    return AIChatResponse(
        reply=reply_text,
        is_emergency=False,
        disclaimer=MEDICAL_DISCLAIMER,
    )