import logging

from app.ai.base.llm_base import BaseLLMClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class GroqLLMClient(BaseLLMClient):
    provider_name = "groq"

    def __init__(self) -> None:
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")
        try:
            from groq import AsyncGroq
        except Exception as exc:
            raise RuntimeError("groq package is required for Groq provider") from exc
        self.model_name = settings.groq_chat_model
        self.client = AsyncGroq(api_key=settings.groq_api_key)

    async def generate(self, prompt: str, **kwargs) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=kwargs.get("model", self.model_name),
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content if response.choices else None
            return content or "No response generated."
        except Exception as exc:
            logger.exception("LLM provider failed", extra={"provider": self.provider_name})
            raise RuntimeError("LLM provider generation failed") from exc
