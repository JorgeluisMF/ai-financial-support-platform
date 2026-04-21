from datetime import UTC, datetime

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    async def create(
        self,
        session: AsyncSession,
        *,
        user_name: str,
        role: str,
        token_hash: str,
        jti: str,
        session_id: str,
        expires_at: datetime,
    ) -> None:
        row = RefreshToken(
            user_name=user_name,
            role=role,
            token_hash=token_hash,
            jti=jti,
            session_id=session_id,
            expires_at=expires_at,
        )
        session.add(row)
        await session.commit()

    async def get_valid_by_hash(
        self,
        session: AsyncSession,
        token_hash: str,
    ) -> RefreshToken | None:
        stmt = select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked.is_(False),
                RefreshToken.expires_at > datetime.now(UTC),
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_by_jti(self, session: AsyncSession, jti: str) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.jti == jti)
            .values(is_revoked=True)
        )
        await session.execute(stmt)
        await session.commit()
