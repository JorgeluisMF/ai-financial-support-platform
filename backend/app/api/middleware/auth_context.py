from fastapi import Request
from fastapi.security.utils import get_authorization_scheme_param
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.security import decode_token


class AuthContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.current_user = None
        authorization = request.headers.get("Authorization")
        if authorization:
            scheme, token = get_authorization_scheme_param(authorization)
            if scheme.lower() == "bearer" and token:
                try:
                    payload = decode_token(token)
                    if payload.get("type") == "access":
                        request.state.current_user = {
                            "username": payload.get("sub"),
                            "role": payload.get("role"),
                            "session_id": payload.get("sid"),
                        }
                except Exception:
                    request.state.current_user = None

        response = await call_next(request)
        return response
