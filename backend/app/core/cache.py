import json
import logging
from hashlib import sha256
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatCache:
    RESPONSE_PREFIX = "chat:response:"

    def __init__(self) -> None:
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.ttl_seconds = settings.chat_cache_ttl_seconds

    @staticmethod
    def build_key(message: str) -> str:
        digest = sha256(message.encode("utf-8")).hexdigest()
        return f"{ChatCache.RESPONSE_PREFIX}{digest}"

    async def get(self, key: str) -> dict[str, Any] | None:
        try:
            value = await self.redis.get(key)
        except Exception:
            logger.exception("Redis get failed")
            return None
        if value is None:
            return None
        try:
            return json.loads(value)
        except Exception:
            logger.exception("Invalid JSON payload in Redis cache")
            return None

    async def set(self, key: str, value: dict[str, Any]) -> None:
        try:
            await self.redis.set(key, json.dumps(value), ex=self.ttl_seconds)
        except Exception:
            logger.exception("Redis set failed")

    async def clear_response_cache(self) -> None:
        try:
            keys = [key async for key in self.redis.scan_iter(match=f"{self.RESPONSE_PREFIX}*")]
            if keys:
                await self.redis.delete(*keys)
        except Exception:
            logger.exception("Redis clear_response_cache failed")
