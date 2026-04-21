from datetime import UTC, datetime, timedelta
from uuid import uuid4
import re

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_refresh_token,
    verify_password,
)
from app.db.repositories.refresh_token_repo import RefreshTokenRepository
from app.db.repositories.user_repo import UserRecord, UserRepository
from app.schemas.auth import CurrentUser, RegisterRequest, TokenResponse

import logging

logger = logging.getLogger(__name__)


class AuthService:
    _ALLOWED_ROLES = {"admin", "agent"}

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository()
        self.refresh_token_repo = RefreshTokenRepository()

    @staticmethod
    def record_to_current(user: UserRecord) -> CurrentUser:
        return CurrentUser(
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            provider=user.provider,
        )

    async def authenticate_user(self, username: str, password: str) -> UserRecord | None:
        await self.user_repo.ensure_seed_users(self.session)
        user = await self.user_repo.get_by_username(self.session, username)
        if user is None:
            logger.info("auth_login_fail", extra={"user_name": username, "auth_event": "login_fail"})
            return None
        if user.password_hash is None:
            logger.info("auth_login_fail", extra={"user_name": username, "auth_event": "login_no_password"})
            return None
        if not verify_password(password, user.password_hash):
            logger.info("auth_login_fail", extra={"user_name": username, "auth_event": "login_fail"})
            return None
        logger.info("auth_login_success", extra={"user_name": user.username, "auth_event": "login_success"})
        return user

    async def register_user(self, payload: RegisterRequest) -> UserRecord:
        username = payload.username.strip().lower()
        if not re.fullmatch(r"^[a-z0-9._-]{3,64}$", username):
            raise ValueError("Invalid username format.")
        email = payload.email.strip().lower()
        if not re.fullmatch(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
            raise ValueError("Invalid email format.")
        if not re.fullmatch(r"^\+?[0-9]{8,15}$", payload.phone.strip()):
            raise ValueError("Invalid phone format. Use only digits and optional + prefix.")
        existing = await self.user_repo.get_by_username(self.session, username)
        if existing is not None:
            logger.info("auth_register_fail", extra={"user_name": username, "auth_event": "register_fail"})
            raise ValueError("Username already exists")
        existing_email = await self.user_repo.get_by_email(self.session, email)
        if existing_email is not None:
            logger.info("auth_register_fail", extra={"user_name": email, "auth_event": "register_fail"})
            raise ValueError("Email already exists")
        identification = payload.identification.strip().upper()
        existing_identification = await self.user_repo.get_by_identification(self.session, identification)
        if existing_identification is not None:
            logger.info("auth_register_fail", extra={"user_name": email, "auth_event": "register_fail"})
            raise ValueError("Identification already exists")
        requested_role = (payload.role or "agent").strip().lower()
        if requested_role not in self._ALLOWED_ROLES:
            raise ValueError("Invalid role. Allowed roles are: admin, agent")
        user = await self.user_repo.create_user(
            self.session,
            username=username,
            email=email,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            phone=payload.phone.strip(),
            address=payload.address.strip(),
            identification=identification,
            password=payload.password,
            role=requested_role,
        )
        logger.info("auth_register_success", extra={"user_name": username, "auth_event": "register_success"})
        return user

    async def issue_token_pair(self, user: UserRecord) -> TokenResponse:
        session_id = str(uuid4())
        refresh_jti = str(uuid4())
        access_jti = str(uuid4())

        refresh_token = create_refresh_token(
            subject=user.username,
            session_id=session_id,
            jti=refresh_jti,
        )
        refresh_hash = hash_refresh_token(refresh_token)
        expires_at = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)
        await self.refresh_token_repo.create(
            self.session,
            user_name=user.username,
            role=user.role,
            token_hash=refresh_hash,
            jti=refresh_jti,
            session_id=session_id,
            expires_at=expires_at,
        )
        access_token = create_access_token(
            subject=user.username,
            role=user.role,
            session_id=session_id,
            jti=access_jti,
            user_id=str(user.id),
            email=user.email,
            provider=user.provider,
        )
        logger.info("auth_tokens_issued", extra={"user_name": user.username, "auth_event": "token_issued"})
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def refresh_token_pair(self, refresh_token: str) -> TokenResponse | None:
        try:
            payload = decode_token(refresh_token)
        except Exception:
            return None
        if payload.get("type") != "refresh":
            return None

        token_hash = hash_refresh_token(refresh_token)
        db_token = await self.refresh_token_repo.get_valid_by_hash(self.session, token_hash)
        if db_token is None:
            logger.info("auth_refresh_fail", extra={"auth_event": "refresh_fail"})
            return None

        await self.refresh_token_repo.revoke_by_jti(self.session, db_token.jti)
        user = await self.user_repo.get_by_username(self.session, db_token.user_name)
        if user is None:
            logger.info("auth_refresh_fail", extra={"auth_event": "refresh_fail"})
            return None
        logger.info("auth_refresh_success", extra={"user_name": user.username, "auth_event": "refresh_success"})
        return await self.issue_token_pair(user)

    async def revoke_refresh_token(self, refresh_token: str) -> bool:
        try:
            payload = decode_token(refresh_token)
        except Exception:
            return False
        jti = payload.get("jti")
        if not isinstance(jti, str):
            return False
        await self.refresh_token_repo.revoke_by_jti(self.session, jti)
        logger.info("auth_logout", extra={"auth_event": "logout"})
        return True

    async def get_user_from_token(self, token: str) -> CurrentUser | None:
        try:
            payload = decode_token(token)
        except Exception:
            return None
        if payload.get("type") != "access":
            return None
        username = payload.get("sub")
        if not isinstance(username, str):
            return None
        user = await self.user_repo.get_by_username(self.session, username)
        if user is None:
            return None
        tok_uid = payload.get("user_id")
        if tok_uid and str(user.id) != str(tok_uid):
            return None
        tok_email = payload.get("email")
        if tok_email and user.email.lower() != str(tok_email).lower():
            return None
        tok_prov = payload.get("provider")
        if tok_prov and user.provider != str(tok_prov):
            return None
        return self.record_to_current(user)

    async def complete_google_oauth(self, code: str) -> UserRecord:
        if not settings.google_client_id or not settings.google_client_secret:
            raise ValueError("Google OAuth is not configured")
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_oauth_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                try:
                    err_json = token_resp.json()
                    detail = err_json.get("error_description") or err_json.get("error") or token_resp.text
                except Exception:
                    detail = token_resp.text or str(token_resp.status_code)
                raise ValueError(f"Token Google: {str(detail)[:240]}")
            tokens = token_resp.json()
            access = tokens.get("access_token")
            if not access:
                raise ValueError("No access token from Google")
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access}"},
            )
            user_resp.raise_for_status()
            info = user_resp.json()

        sub = info.get("sub")
        email = info.get("email")
        if not sub or not email:
            raise ValueError("Incomplete Google profile")
        if not info.get("email_verified", True):
            raise ValueError("Google email not verified")
        email = str(email).lower()
        picture = info.get("picture")
        name = str(info.get("name") or email.split("@")[0])
        parts = name.strip().split(None, 1)
        first_name = parts[0][:100] if parts else "User"
        last_name = parts[1][:100] if len(parts) > 1 else "."

        existing_google = await self.user_repo.get_by_google_sub(self.session, sub)
        if existing_google is not None:
            return existing_google

        existing_email = await self.user_repo.get_by_email(self.session, email)
        if existing_email is not None:
            if existing_email.provider_id and existing_email.provider_id != sub:
                raise ValueError("Email already linked to another Google account")
            merged = await self.user_repo.merge_google_profile(
                self.session,
                existing_email.id,
                google_sub=sub,
                picture=picture,
            )
            if merged is None:
                raise ValueError("Unable to link Google account")
            return merged

        return await self.user_repo.create_google_user(
            self.session,
            email=email,
            google_sub=sub,
            first_name=first_name,
            last_name=last_name,
            picture=picture,
            role=settings.default_sso_role,
        )
