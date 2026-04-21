from abc import ABC, abstractmethod


class BaseLLMClient(ABC):
    provider_name: str = "unknown"
    model_name: str = "unknown"

    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError
