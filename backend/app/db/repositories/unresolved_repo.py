import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.unresolved_question import UnresolvedQuestion


class UnresolvedQuestionRepository:
    async def create(
        self,
        session: AsyncSession,
        *,
        chat_log_id: uuid.UUID,
        session_id: str,
        user_id_hash: str,
        question_text: str,
        answer_text: str,
        reason: str,
        top_retrieval_score: float | None,
        retrieved_chunk_count: int,
    ) -> uuid.UUID:
        row = UnresolvedQuestion(
            chat_log_id=chat_log_id,
            session_id=session_id,
            user_id_hash=user_id_hash,
            question_text=question_text,
            answer_text=answer_text,
            reason=reason,
            top_retrieval_score=top_retrieval_score,
            retrieved_chunk_count=retrieved_chunk_count,
            status="open",
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return row.id

    async def list_open(
        self,
        session: AsyncSession,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> list[UnresolvedQuestion]:
        stmt = (
            select(UnresolvedQuestion)
            .where(UnresolvedQuestion.status == "open")
            .order_by(UnresolvedQuestion.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def count_open(self, session: AsyncSession) -> int:
        stmt = select(func.count(UnresolvedQuestion.id)).where(UnresolvedQuestion.status == "open")
        result = await session.execute(stmt)
        return int(result.scalar_one() or 0)

    async def get_by_id(
        self,
        session: AsyncSession,
        unresolved_id: uuid.UUID,
    ) -> UnresolvedQuestion | None:
        stmt = select(UnresolvedQuestion).where(UnresolvedQuestion.id == unresolved_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_resolved(
        self,
        session: AsyncSession,
        unresolved_id: uuid.UUID,
    ) -> bool:
        row = await self.get_by_id(session, unresolved_id)
        if row is None:
            return False
        row.status = "resolved"
        await session.commit()
        return True
