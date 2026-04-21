import hashlib

from app.ai.base.embedding_base import BaseEmbeddingClient


class LocalEmbeddingClient(BaseEmbeddingClient):
    provider_name = "local"

    def __init__(self, dimension: int = 3072) -> None:
        self.dimension = dimension
        self.model_name = f"local-hash-{dimension}"

    async def embed(self, text: str) -> list[float]:
        values = [0.0] * self.dimension
        normalized = (text or "").strip().lower()
        if not normalized:
            return values

        tokens = normalized.split()
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:4], "big") % self.dimension
            sign = -1.0 if digest[4] % 2 else 1.0
            values[idx] += sign

        norm = sum(v * v for v in values) ** 0.5
        if norm == 0:
            return values
        return [v / norm for v in values]
