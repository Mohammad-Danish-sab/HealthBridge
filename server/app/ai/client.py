import json
import logging
from typing import List, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        self.api_key = settings.AI_PROVIDER_API_KEY
        self.model = settings.AI_MODEL_NAME
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def generate_text(self, system_prompt: str, messages: List[Dict[str, str]]) -> str:
        if not self.client:
            raise RuntimeError("AI_PROVIDER_API_KEY is not configured on the server.")

        full_messages = [{"role": "system", "content": system_prompt}] + messages
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    async def generate_json(self, system_prompt: str, user_content: str) -> Dict[str, Any]:
        if not self.client:
            raise RuntimeError("AI_PROVIDER_API_KEY is not configured on the server.")

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=0.1,
        )
        raw_content = response.choices[0].message.content or "{}"
        return json.loads(raw_content)

llm_client = LLMClient()