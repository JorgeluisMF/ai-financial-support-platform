from app.ai.base.llm_base import BaseLLMClient
from app.ai.factory import get_llm_client


class LLMClient(BaseLLMClient):
    def __init__(self) -> None:
        self._delegate = get_llm_client()
        self.provider_name = self._delegate.provider_name
        self.model_name = self._delegate.model_name

    async def generate(self, prompt: str, **kwargs) -> str:
        return await self._delegate.generate(prompt, **kwargs)
