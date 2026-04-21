import logging
from time import perf_counter
from typing import Any
from uuid import UUID, uuid4

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base.embedding_base import BaseEmbeddingClient
from app.ai.base.llm_base import BaseLLMClient
from app.ai.factory import get_embedding_client, get_llm_client
from app.ai.prompt_builder import build_chat_prompt
from app.ai.retrieval import RetrievalClient
from app.core.cache import ChatCache
from app.core.config import settings
from app.core.security import hash_user_id
from app.db.repositories.chat_log_repo import ChatLogRepository
from app.db.repositories.unresolved_repo import UnresolvedQuestionRepository
from app.schemas.chat import ChatRequest, ChatResponse, SourceItem
from app.services.input_sanitizer import sanitize_user_message
from app.services.unresolved_detection import evaluate_unresolved

logger = logging.getLogger(__name__)

_ERROR_DETAIL_MAX_LEN = 2000


class ChatService:
    def __init__(self) -> None:
        self.embedding_client: BaseEmbeddingClient = get_embedding_client()
        self.retrieval_client = RetrievalClient()
        self.llm_client: BaseLLMClient = get_llm_client()
        self.chat_cache = ChatCache()
        self.chat_log_repo = ChatLogRepository()
        self.unresolved_repo = UnresolvedQuestionRepository()

    async def handle_chat(
        self,
        payload: ChatRequest,
        session: AsyncSession,
        background_tasks: BackgroundTasks,
    ) -> ChatResponse:
        started_at = perf_counter()
        sanitized = sanitize_user_message(payload.message)
        message_to_process = sanitized.cleaned_text
        retrieved_chunks: list[dict[str, Any]] = []
        answer_text = ""
        status = "success"
        error_detail: str | None = None
        failure: Exception | None = None
        cache_hit = False

        cache_key = self.chat_cache.build_key(message_to_process)
        cached_response = await self.chat_cache.get(cache_key)
        if cached_response is not None:
            cache_hit = True
            answer_text = str(cached_response.get("answer", ""))
            cached_sources = cached_response.get("sources", [])
            if isinstance(cached_sources, list):
                retrieved_chunks = [
                    {
                        "chunk_id": item.get("chunk_id"),
                        "source_ref": item.get("source_ref", ""),
                        "score": float(item.get("score", 0.0)),
                    }
                    for item in cached_sources
                    if isinstance(item, dict) and item.get("chunk_id")
                ]
        else:
            try:
                query_embedding = await self.embedding_client.embed(message_to_process)
                retrieved_chunks = await self.retrieval_client.retrieve(
                    query_embedding, session=session
                )
                prompt = build_chat_prompt(
                    user_question=message_to_process,
                    chunks=retrieved_chunks,
                )
                answer_text = await self.llm_client.generate(prompt)
            except Exception as exc:
                status = "error"
                error_detail = str(exc)[:_ERROR_DETAIL_MAX_LEN]
                failure = exc

        latency_ms = int((perf_counter() - started_at) * 1000)
        chunk_ids = [UUID(str(item["chunk_id"])) for item in retrieved_chunks]

        log_id = uuid4()

        if failure is not None:
            try:
                await self.chat_log_repo.create(
                    session,
                    log_id=log_id,
                    session_id=payload.session_id,
                    user_id_hash=hash_user_id(payload.user_id),
                    question_text=message_to_process,
                    retrieved_chunk_ids=chunk_ids,
                    prompt_version=settings.chat_prompt_version,
                    answer_text=answer_text,
                    model_name=self.llm_client.model_name,
                    input_tokens=0,
                    output_tokens=0,
                    latency_ms=latency_ms,
                    status=status,
                    error_detail=error_detail,
                )
            except Exception:
                logger.exception("Failed to persist error chat log")
            logger.error(
                "chat_failed",
                extra={
                    "request_id": payload.session_id,
                    "method": "POST",
                    "path": "/chat",
                    "status_code": 500,
                    "duration_ms": latency_ms,
                },
            )
            raise failure

        should_flag, reason, top_score, chunk_count = evaluate_unresolved(
            answer_text,
            retrieved_chunks,
            score_threshold=settings.unresolved_score_threshold,
            negative_phrases_csv=settings.unresolved_negative_phrases,
        )

        if not cache_hit:
            await self.chat_cache.set(
                cache_key,
                {
                    "answer": answer_text,
                    "sources": [
                        {
                            "chunk_id": str(item["chunk_id"]),
                            "source_ref": item["source_ref"],
                            "score": float(item["score"]),
                        }
                        for item in retrieved_chunks
                    ],
                    "model_info": self.llm_client.model_name,
                },
            )

        await self.chat_log_repo.create(
            session,
            log_id=log_id,
            session_id=payload.session_id,
            user_id_hash=hash_user_id(payload.user_id),
            question_text=message_to_process,
            retrieved_chunk_ids=chunk_ids,
            prompt_version=settings.chat_prompt_version,
            answer_text=answer_text,
            model_name=self.llm_client.model_name,
            input_tokens=0,
            output_tokens=0,
            latency_ms=latency_ms,
            status=status,
            error_detail=error_detail,
        )

        if should_flag and reason:
            await self.unresolved_repo.create(
                session,
                chat_log_id=log_id,
                session_id=payload.session_id,
                user_id_hash=hash_user_id(payload.user_id),
                question_text=message_to_process,
                answer_text=answer_text,
                reason=reason,
                top_retrieval_score=top_score,
                retrieved_chunk_count=chunk_count,
            )

        logger.info(
            "chat_completed",
            extra={
                "event": "chat_completed",
                "provider": self.llm_client.provider_name,
                "model": self.llm_client.model_name,
                "request_id": payload.session_id,
                "method": "POST",
                "path": "/chat",
                "status_code": 200,
                "duration_ms": latency_ms,
            },
        )

        warning_flags = (["cache_hit"] if cache_hit else []) + sanitized.flags
        if should_flag:
            warning_flags.append("unresolved")
            if reason:
                warning_flags.append(f"unresolved_reason:{reason}")

        return ChatResponse(
            conversation_id=log_id,
            answer=answer_text,
            sources=[
                SourceItem(
                    chunk_id=item["chunk_id"],
                    source_ref=item["source_ref"],
                    score=float(item["score"]),
                )
                for item in retrieved_chunks
            ],
            model_info=self.llm_client.model_name,
            latency_ms=latency_ms,
            warnings=warning_flags,
        )
