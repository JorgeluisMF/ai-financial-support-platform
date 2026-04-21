from abc import ABC, abstractmethod


class BaseEmbeddingClient(ABC):
    provider_name: str = "unknown"
    model_name: str = "unknown"

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError
