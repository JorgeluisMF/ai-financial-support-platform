import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.chat_log import ChatLog


class ChatLogRepository:
    async def create(
        self,
        session: AsyncSession,
        *,
        log_id: uuid.UUID | None = None,
        session_id: str,
        user_id_hash: str,
        question_text: str,
        retrieved_chunk_ids: list[uuid.UUID],
        prompt_version: str,
        answer_text: str,
        model_name: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
        status: str,
        error_detail: str | None,
    ) -> uuid.UUID:
        row = ChatLog(
            id=log_id or uuid.uuid4(),
            session_id=session_id,
            user_id_hash=user_id_hash,
            question_text=question_text,
            retrieved_chunk_ids=retrieved_chunk_ids,
            prompt_version=prompt_version,
            answer_text=answer_text,
            model_name=model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            status=status,
            error_detail=error_detail,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return row.id

    async def list_recent(self, session: AsyncSession, *, limit: int) -> list[ChatLog]:
        statement = select(ChatLog).order_by(desc(ChatLog.created_at)).limit(limit)
        result = await session.execute(statement)
        return list(result.scalars().all())
