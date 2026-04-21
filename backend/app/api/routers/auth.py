import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from app.api.deps import get_auth_service, get_current_user
from app.core.config import settings
from app.core.security import create_oauth_state_token, verify_oauth_state_token
from app.schemas.auth import (
    CurrentUser,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter()


def _frontend_oauth_base() -> str:
    url = settings.frontend_oauth_success_url
    return url.split("#", 1)[0].split("?", 1)[0]


def _redirect_with_tokens(pair: TokenResponse) -> RedirectResponse:
    fragment = urlencode(
        {
            "access_token": pair.access_token,
            "refresh_token": pair.refresh_token,
            "expires_in": str(pair.expires_in),
        }
    )
    target = f"{_frontend_oauth_base()}#{fragment}"
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


@router.post("/register", response_model=TokenResponse, summary="Register and get JWT access token")
async def register(
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    try:
        user = await service.register_user(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return await service.issue_token_pair(user)


@router.post("/login", response_model=TokenResponse, summary="Login and get JWT access token")
async def login(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    user = await service.authenticate_user(payload.username, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return await service.issue_token_pair(user)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh JWT token pair")
async def refresh(
    payload: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    token_pair = await service.refresh_token_pair(payload.refresh_token)
    if token_pair is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    return token_pair


@router.post("/logout", summary="Logout and revoke refresh token")
async def logout(
    payload: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    revoked = await service.revoke_refresh_token(payload.refresh_token)
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    return {"status": "ok"}


@router.get("/me", response_model=CurrentUser, summary="Get current authenticated user")
async def me(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return current_user


@router.get("/google/login", summary="Start Google OAuth2 login")
async def google_login() -> RedirectResponse:
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    state = create_oauth_state_token()
    params = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_oauth_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
        }
    )
    authorize_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    # El state va firmado en la URL (Google lo devuelve); no usamos cookie para evitar
    # fallos al mezclar localhost y 127.0.0.1 como host del API (cookies no se comparten).
    return RedirectResponse(url=authorize_url, status_code=status.HTTP_302_FOUND)


@router.get("/google/callback", summary="Google OAuth2 callback")
async def google_callback(
    service: AuthService = Depends(get_auth_service),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    base = _frontend_oauth_base()
    if error:
        return RedirectResponse(url=f"{base}?error=oauth_denied", status_code=status.HTTP_302_FOUND)
    if not state:
        logger.warning("google_oauth_state_missing")
        return RedirectResponse(url=f"{base}?error=oauth_state", status_code=status.HTTP_302_FOUND)
    ok, state_err = verify_oauth_state_token(state)
    if not ok:
        if state_err == "expired":
            logger.warning("google_oauth_state_expired")
            return RedirectResponse(
                url=f"{base}?error=oauth_state_expired",
                status_code=status.HTTP_302_FOUND,
            )
        logger.warning("google_oauth_state_invalid", extra={"detail": state_err})
        return RedirectResponse(url=f"{base}?error=oauth_state", status_code=status.HTTP_302_FOUND)
    if not code:
        return RedirectResponse(url=f"{base}?error=oauth_code", status_code=status.HTTP_302_FOUND)
    try:
        user = await service.complete_google_oauth(code)
        pair = await service.issue_token_pair(user)
    except ValueError as exc:
        logger.info("google_oauth_fail", extra={"detail": str(exc)})
        q: dict[str, str] = {"error": "oauth_failed"}
        if settings.environment.lower() == "development":
            q["reason"] = str(exc)[:500]
        return RedirectResponse(
            url=f"{base}?{urlencode(q)}",
            status_code=status.HTTP_302_FOUND,
        )
    except Exception:
        logger.exception("google_oauth_unexpected")
        return RedirectResponse(url=f"{base}?error=oauth_failed", status_code=status.HTTP_302_FOUND)
    return _redirect_with_tokens(pair)


