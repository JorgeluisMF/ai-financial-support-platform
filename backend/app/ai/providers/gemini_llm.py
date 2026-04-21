import asyncio
import logging

from google import genai

from app.ai.base.llm_base import BaseLLMClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiLLMClient(BaseLLMClient):
    provider_name = "gemini"

    def __init__(self) -> None:
        self.model_name = settings.gemini_chat_model
        self.client = genai.Client(api_key=settings.gemini_api_key)

    async def generate(self, prompt: str, **kwargs) -> str:
        def _generate() -> str:
            response = self.client.models.generate_content(
                model=kwargs.get("model", self.model_name),
                contents=prompt,
            )
            return response.text or "Could not generate a response."

        try:
            return await asyncio.to_thread(_generate)
        except Exception as exc:
            logger.exception("LLM provider failed", extra={"provider": self.provider_name})
            raise RuntimeError("LLM provider generation failed") from exc
