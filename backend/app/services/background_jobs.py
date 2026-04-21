import logging
import uuid

from app.db.repositories.chat_log_repo import ChatLogRepository
from app.db.repositories.unresolved_repo import UnresolvedQuestionRepository
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def persist_chat_log_job(
    *,
    log_id: uuid.UUID,
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
) -> None:
    repo = ChatLogRepository()
    async with AsyncSessionLocal() as session:
        try:
            await repo.create(
                session,
                log_id=log_id,
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
        except Exception:
            logger.exception("Background chat log persistence failed")


async def persist_unresolved_job(
    *,
    chat_log_id: uuid.UUID,
    session_id: str,
    user_id_hash: str,
    question_text: str,
    answer_text: str,
    reason: str,
    top_retrieval_score: float | None,
    retrieved_chunk_count: int,
) -> None:
    repo = UnresolvedQuestionRepository()
    async with AsyncSessionLocal() as session:
        try:
            await repo.create(
                session,
                chat_log_id=chat_log_id,
                session_id=session_id,
                user_id_hash=user_id_hash,
                question_text=question_text,
                answer_text=answer_text,
                reason=reason,
                top_retrieval_score=top_retrieval_score,
                retrieved_chunk_count=retrieved_chunk_count,
            )
        except Exception:
            logger.exception("Background unresolved persistence failed")
