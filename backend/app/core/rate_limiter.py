import logging
from dataclasses import dataclass

from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class RateLimitResult:
    allowed: bool
    remaining: int
    retry_after_seconds: int


class RedisRateLimiter:
    def __init__(self) -> None:
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.max_requests = settings.rate_limit_requests
        self.window_seconds = settings.rate_limit_window_seconds

    async def check(self, key: str) -> RateLimitResult:
        bucket_key = f"rate_limit:{key}"
        try:
            current = await self.redis.incr(bucket_key)
            if current == 1:
                await self.redis.expire(bucket_key, self.window_seconds)
            ttl = await self.redis.ttl(bucket_key)
        except Exception:
            logger.exception("Rate limiter Redis failure; allowing request")
            return RateLimitResult(
                allowed=True,
                remaining=self.max_requests,
                retry_after_seconds=0,
            )

        remaining = max(self.max_requests - current, 0)
        retry_after = max(ttl, 0)
        allowed = current <= self.max_requests
        return RateLimitResult(
            allowed=allowed,
            remaining=remaining,
            retry_after_seconds=retry_after,
        )
