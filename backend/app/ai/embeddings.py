from app.ai.base.embedding_base import BaseEmbeddingClient
from app.ai.factory import get_embedding_client


class EmbeddingClient(BaseEmbeddingClient):
    def __init__(self) -> None:
        self._delegate = get_embedding_client()
        self.provider_name = self._delegate.provider_name
        self.model_name = self._delegate.model_name

    async def embed(self, text: str) -> list[float]:
        return await self._delegate.embed(text)

    async def embed_text(self, text: str) -> list[float]:
        # Backward-compatible alias for existing service usage.
        return await self.embed(text)
