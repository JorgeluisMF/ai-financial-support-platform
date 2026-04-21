import asyncio
import logging

from google import genai

from app.ai.base.embedding_base import BaseEmbeddingClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiEmbeddingClient(BaseEmbeddingClient):
    provider_name = "gemini"

    def __init__(self) -> None:
        self.model_name = settings.gemini_embedding_model
        self.client = genai.Client(api_key=settings.gemini_api_key)

    async def embed(self, text: str) -> list[float]:
        def _embed() -> list[float]:
            models_to_try = [self.model_name, "gemini-embedding-001"]
            last_error: Exception | None = None
            for model in dict.fromkeys(models_to_try):
                try:
                    response = self.client.models.embed_content(
                        model=model,
                        contents=text,
                    )
                    return list(response.embeddings[0].values)
                except Exception as exc:
                    last_error = exc
            raise RuntimeError(
                f"Embedding request failed for models: {models_to_try}"
            ) from last_error

        try:
            return await asyncio.to_thread(_embed)
        except Exception as exc:
            logger.exception(
                "Embedding provider failed", extra={"provider": self.provider_name}
            )
            raise RuntimeError("Embedding provider failed") from exc
