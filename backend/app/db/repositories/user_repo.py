from dataclasses import dataclass
import hashlib
import re
import secrets
import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.models.user import User


@dataclass(frozen=True)
class UserRecord:
    id: uuid.UUID
    username: str
    email: str
    first_name: str
    last_name: str
    phone: str
    address: str
    identification: str
    role: str
    password_hash: str | None
    provider: str
    provider_id: str | None
    is_verified: bool
    avatar_url: str | None


class UserRepository:
    async def get_by_username(self, session: AsyncSession, username: str) -> UserRecord | None:
        stmt = select(User).where(or_(User.username == username, User.email == username))
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_record(row) if row else None

    async def get_by_id(self, session: AsyncSession, user_id: uuid.UUID) -> UserRecord | None:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_record(row) if row else None

    async def get_by_email(self, session: AsyncSession, email: str) -> UserRecord | None:
        stmt = select(User).where(User.email == email.lower())
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_record(row) if row else None

    async def get_by_google_sub(self, session: AsyncSession, sub: str) -> UserRecord | None:
        stmt = select(User).where(User.provider == "google", User.provider_id == sub)
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_record(row) if row else None

    async def get_by_identification(self, session: AsyncSession, identification: str) -> UserRecord | None:
        stmt = select(User).where(User.identification == identification)
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_record(row) if row else None

    async def create_user(
        self,
        session: AsyncSession,
        *,
        username: str,
        email: str,
        first_name: str,
        last_name: str,
        phone: str,
        address: str,
        identification: str,
        password: str,
        role: str = "agent",
    ) -> UserRecord:
        row = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address=address,
            identification=identification,
            password_hash=hash_password(password),
            role=role,
            provider="local",
            provider_id=None,
            is_verified=True,
            avatar_url=None,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return self._to_record(row)

    async def create_google_user(
        self,
        session: AsyncSession,
        *,
        email: str,
        google_sub: str,
        first_name: str,
        last_name: str,
        picture: str | None,
        role: str,
    ) -> UserRecord:
        username = await self._allocate_username(session, email)
        identification = self._google_identification(google_sub)
        row = User(
            username=username,
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            phone="+00000000000",
            address="OAuth",
            identification=identification,
            password_hash=None,
            role=role,
            provider="google",
            provider_id=google_sub,
            is_verified=True,
            avatar_url=picture,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return self._to_record(row)

    async def merge_google_profile(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        *,
        google_sub: str,
        picture: str | None,
    ) -> UserRecord | None:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None
        row.provider = "google"
        row.provider_id = google_sub
        if picture:
            row.avatar_url = picture
        row.is_verified = True
        await session.commit()
        await session.refresh(row)
        return self._to_record(row)

    async def ensure_seed_users(self, session: AsyncSession) -> None:
        existing_stmt = select(User).where(
            or_(
                User.email == "admin@local.dev",
                User.email == "agent@local.dev",
                User.username == "admin",
                User.username == "agent",
            )
        )
        result = await session.execute(existing_stmt)
        existing_rows = result.scalars().all()
        existing_emails = {row.email for row in existing_rows}
        existing_usernames = {row.username for row in existing_rows}
        seeds = [
            ("admin", "admin@local.dev", "Admin", "Root", "+34000000001", "Admin Street 1", "ADM-001", "admin123", "admin"),
            ("agent", "agent@local.dev", "Agent", "Support", "+34000000002", "Agent Street 2", "AGT-001", "agent123", "agent"),
        ]
        created = False
        for username, email, first_name, last_name, phone, address, identification, password, role in seeds:
            if email in existing_emails or username in existing_usernames:
                continue
            session.add(
                User(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    address=address,
                    identification=identification,
                    password_hash=hash_password(password),
                    role=role,
                    provider="local",
                    provider_id=None,
                    is_verified=True,
                    avatar_url=None,
                )
            )
            created = True
        if created:
            await session.commit()

    @staticmethod
    def _google_identification(google_sub: str) -> str:
        digest = hashlib.sha256(google_sub.encode("utf-8")).hexdigest()[:28]
        return f"G-{digest}"[:64]

    @staticmethod
    async def _allocate_username(session: AsyncSession, email: str) -> str:
        local = email.split("@", 1)[0].lower()
        base = re.sub(r"[^a-z0-9._-]", "", local) or "user"
        if len(base) < 3:
            base = base + "usr"
        base = base[:60]
        candidate = base
        for _ in range(50):
            stmt = select(User.id).where(User.username == candidate).limit(1)
            result = await session.execute(stmt)
            if result.scalar_one_or_none() is None:
                return candidate
            suffix = secrets.token_hex(2)
            candidate = f"{base[:56]}-{suffix}"
        return f"{base[:50]}-{secrets.token_hex(4)}"

    @staticmethod
    def _to_record(row: User) -> UserRecord:
        return UserRecord(
            id=row.id,
            username=row.username,
            email=row.email,
            first_name=row.first_name,
            last_name=row.last_name,
            phone=row.phone,
            address=row.address,
            identification=row.identification,
            role=row.role,
            password_hash=row.password_hash,
            provider=getattr(row, "provider", "local") or "local",
            provider_id=getattr(row, "provider_id", None),
            is_verified=getattr(row, "is_verified", True),
            avatar_url=getattr(row, "avatar_url", None),
        )
