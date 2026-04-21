import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2", "pbkdf2_sha256"], deprecated="auto")


def hash_user_id(user_id: str) -> str:
    """One-way fingerprint for correlating sessions without storing raw user_id."""
    pepper = (settings.user_id_hash_pepper or "").encode("utf-8")
    value = user_id.encode("utf-8")
    return hashlib.sha256(pepper + b"|" + value).hexdigest()


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def create_access_token(
    subject: str,
    role: str,
    session_id: str,
    jti: str,
    *,
    user_id: str | None = None,
    email: str | None = None,
    provider: str | None = None,
) -> str:
    expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    expire = datetime.now(UTC) + expires_delta
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "jti": jti,
        "sid": session_id,
        "type": "access",
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    if user_id:
        payload["user_id"] = user_id
    if email:
        payload["email"] = email
    if provider:
        payload["provider"] = provider
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(subject: str, session_id: str, jti: str) -> str:
    expire = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)
    payload: dict[str, Any] = {
        "sub": subject,
        "jti": jti,
        "sid": session_id,
        "type": "refresh",
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
    )


def create_oauth_state_token() -> str:
    """Short-lived signed state for Google OAuth CSRF protection."""
    expire = datetime.now(UTC) + timedelta(minutes=30)
    payload: dict[str, Any] = {
        "typ": "oauth_state",
        "nonce": secrets.token_urlsafe(16),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_oauth_state_token(state: str) -> tuple[bool, str | None]:
    """Returns (True, None) when state is valid; otherwise (False, code) for logs or UI."""
    try:
        payload = jwt.decode(
            state,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
        if payload.get("typ") != "oauth_state":
            return False, "invalid_type"
        return True, None
    except ExpiredSignatureError:
        return False, "expired"
    except InvalidTokenError:
        return False, "invalid_token"
    except Exception:
        return False, "invalid"
