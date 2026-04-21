import logging

from app.ai.base.embedding_base import BaseEmbeddingClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIEmbeddingClient(BaseEmbeddingClient):
    provider_name = "openai"

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        try:
            from openai import AsyncOpenAI
        except Exception as exc:
            raise RuntimeError("openai package is required for OpenAI provider") from exc
        self.model_name = settings.openai_embedding_model
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def embed(self, text: str) -> list[float]:
        try:
            response = await self.client.embeddings.create(
                model=self.model_name,
                input=text,
            )
            return list(response.data[0].embedding)
        except Exception as exc:
            logger.exception(
                "Embedding provider failed", extra={"provider": self.provider_name}
            )
            raise RuntimeError("Embedding provider failed") from exc
