import logging

from app.ai.base.llm_base import BaseLLMClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAILLMClient(BaseLLMClient):
    provider_name = "openai"

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        try:
            from openai import AsyncOpenAI
        except Exception as exc:
            raise RuntimeError("openai package is required for OpenAI provider") from exc
        self.model_name = settings.openai_chat_model
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def generate(self, prompt: str, **kwargs) -> str:
        try:
            response = await self.client.responses.create(
                model=kwargs.get("model", self.model_name),
                input=prompt,
            )
            return response.output_text or "No response generated."
        except Exception as exc:
            logger.exception("LLM provider failed", extra={"provider": self.provider_name})
            raise RuntimeError("LLM provider generation failed") from exc
