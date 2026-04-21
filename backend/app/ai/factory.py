import logging

from app.ai.base.embedding_base import BaseEmbeddingClient
from app.ai.base.llm_base import BaseLLMClient
from app.ai.providers.gemini_embedding import GeminiEmbeddingClient
from app.ai.providers.gemini_llm import GeminiLLMClient
from app.ai.providers.groq_llm import GroqLLMClient
from app.ai.providers.local_embedding import LocalEmbeddingClient
from app.ai.providers.openai_embedding import OpenAIEmbeddingClient
from app.ai.providers.openai_llm import OpenAILLMClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class FallbackLLMClient(BaseLLMClient):
    def __init__(self, primary: BaseLLMClient, fallback: BaseLLMClient) -> None:
        self.primary = primary
        self.fallback = fallback
        self.provider_name = f"{primary.provider_name}->{fallback.provider_name}"
        self.model_name = primary.model_name

    async def generate(self, prompt: str, **kwargs) -> str:
        try:
            return await self.primary.generate(prompt, **kwargs)
        except Exception:
            logger.exception(
                "Primary LLM provider failed; using fallback",
                extra={"provider": self.primary.provider_name},
            )
            return await self.fallback.generate(prompt, **kwargs)


class FallbackEmbeddingClient(BaseEmbeddingClient):
    def __init__(
        self, primary: BaseEmbeddingClient, fallback: BaseEmbeddingClient
    ) -> None:
        self.primary = primary
        self.fallback = fallback
        self.provider_name = f"{primary.provider_name}->{fallback.provider_name}"
        self.model_name = primary.model_name

    async def embed(self, text: str) -> list[float]:
        try:
            return await self.primary.embed(text)
        except Exception:
            logger.exception(
                "Primary embedding provider failed; using fallback",
                extra={"provider": self.primary.provider_name},
            )
            return await self.fallback.embed(text)


def _build_llm_client(provider: str) -> BaseLLMClient:
    provider_key = provider.lower()
    if provider_key == "openai":
        return OpenAILLMClient()
    if provider_key == "groq":
        return GroqLLMClient()
    if provider_key in {"gemini", "ollama"}:
        return GeminiLLMClient()
    raise ValueError(f"Unsupported LLM provider: {provider}")


def _build_embedding_client(provider: str) -> BaseEmbeddingClient:
    provider_key = provider.lower()
    if provider_key == "openai":
        return OpenAIEmbeddingClient()
    if provider_key == "local":
        return LocalEmbeddingClient()
    if provider_key in {"gemini", "ollama"}:
        return GeminiEmbeddingClient()
    raise ValueError(f"Unsupported embedding provider: {provider}")


def get_llm_client() -> BaseLLMClient:
    fallback_provider = settings.llm_fallback_provider
    try:
        primary = _build_llm_client(settings.llm_provider)
    except Exception:
        if not fallback_provider:
            raise
        logger.exception(
            "Primary LLM provider initialization failed; using fallback",
            extra={"provider": settings.llm_provider},
        )
        return _build_llm_client(fallback_provider)

    if not fallback_provider:
        return primary

    try:
        fallback = _build_llm_client(fallback_provider)
    except Exception:
        logger.exception(
            "LLM fallback provider initialization failed; using primary only",
            extra={"provider": fallback_provider},
        )
        return primary
    return FallbackLLMClient(primary, fallback)


def get_embedding_client() -> BaseEmbeddingClient:
    fallback_provider = settings.embedding_fallback_provider
    try:
        primary = _build_embedding_client(settings.embedding_provider)
    except Exception:
        if not fallback_provider:
            raise
        logger.exception(
            "Primary embedding provider initialization failed; using fallback",
            extra={"provider": settings.embedding_provider},
        )
        return _build_embedding_client(fallback_provider)

    if not fallback_provider:
        return primary

    try:
        fallback = _build_embedding_client(fallback_provider)
    except Exception:
        logger.exception(
            "Embedding fallback provider initialization failed; using primary only",
            extra={"provider": fallback_provider},
        )
        return primary
    return FallbackEmbeddingClient(primary, fallback)
