import logging
from time import perf_counter
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid4()))
        started_at = perf_counter()

        response: Response | None = None
        try:
            response = await call_next(request)
            return response
        finally:
            duration_ms = int((perf_counter() - started_at) * 1000)
            status_code = response.status_code if response is not None else 500
            if response is not None:
                response.headers["x-request-id"] = request_id

            current_user = getattr(request.state, "current_user", None)
            logger.info(
                "http_request",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                    "user_name": current_user.get("username") if isinstance(current_user, dict) else None,
                    "user_role": current_user.get("role") if isinstance(current_user, dict) else None,
                },
            )
