from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limiter import RedisRateLimiter
from app.db.session import get_db_session
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()


def get_chat_service() -> ChatService:
    return ChatService()


def get_rate_limiter() -> RedisRateLimiter:
    return RedisRateLimiter()


@router.post("", response_model=ChatResponse, summary="Chat with AI agent")
async def chat(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    payload: ChatRequest,
    session: AsyncSession = Depends(get_db_session),
    service: ChatService = Depends(get_chat_service),
    rate_limiter: RedisRateLimiter = Depends(get_rate_limiter),
) -> ChatResponse:
    client_ip = request.client.host if request.client else "unknown"
    identifier = payload.session_id or client_ip
    key = f"chat:{identifier}"
    result = await rate_limiter.check(key)
    response.headers["x-ratelimit-limit"] = str(rate_limiter.max_requests)
    response.headers["x-ratelimit-remaining"] = str(result.remaining)
    response.headers["x-ratelimit-reset"] = str(result.retry_after_seconds)
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(result.retry_after_seconds)},
        )

    return await service.handle_chat(
        payload,
        session=session,
        background_tasks=background_tasks,
    )
