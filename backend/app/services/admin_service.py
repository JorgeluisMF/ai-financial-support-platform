from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.metrics_repo import MetricsRepository
from app.db.repositories.unresolved_repo import UnresolvedQuestionRepository
from app.schemas.admin import (
    AdminMetricsResponse,
    ConversationItem,
    ConversationListResponse,
    ResolveUnresolvedRequest,
    ResolveUnresolvedResponse,
    UnresolvedItem,
    UnresolvedListResponse,
)
from app.schemas.ingestion import IngestRequest
from app.services.ingestion_service import IngestionService
from app.db.repositories.chat_log_repo import ChatLogRepository


class AdminService:
    def __init__(self) -> None:
        self.unresolved_repo = UnresolvedQuestionRepository()
        self.metrics_repo = MetricsRepository()
        self.ingestion_service = IngestionService()
        self.chat_log_repo = ChatLogRepository()

    async def list_unresolved(
        self,
        session: AsyncSession,
        *,
        page: int,
        page_size: int,
    ) -> UnresolvedListResponse:
        offset = (page - 1) * page_size
        total = await self.unresolved_repo.count_open(session)
        rows = await self.unresolved_repo.list_open(session, offset=offset, limit=page_size)
        items = [
            UnresolvedItem(
                id=row.id,
                chat_log_id=row.chat_log_id,
                session_id=row.session_id,
                question_text=row.question_text,
                answer_text=row.answer_text,
                reason=row.reason,
                top_retrieval_score=row.top_retrieval_score,
                retrieved_chunk_count=row.retrieved_chunk_count,
                status=row.status,
                created_at=row.created_at,
            )
            for row in rows
        ]
        return UnresolvedListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=(offset + len(items)) < total,
        )

    async def resolve_unresolved(
        self,
        payload: ResolveUnresolvedRequest,
        session: AsyncSession,
    ) -> ResolveUnresolvedResponse:
        row = await self.unresolved_repo.get_by_id(session, payload.unresolved_id)
        if row is None:
            raise ValueError("Unresolved question was not found")
        if row.status != "open":
            raise ValueError("Unresolved question is already resolved")

        ingest_payload = IngestRequest(
            document_id=payload.document_id or f"resolved-{payload.unresolved_id}",
            source_type=payload.source_type,
            source_ref=payload.source_ref or f"admin/unresolved/{payload.unresolved_id}",
            version=payload.version,
            content=payload.content,
            tags=payload.tags,
            chunk_size=payload.chunk_size,
            chunk_overlap=payload.chunk_overlap,
        )
        ingest_result = await self.ingestion_service.ingest_document(ingest_payload, session)
        await self.unresolved_repo.mark_resolved(session, payload.unresolved_id)

        return ResolveUnresolvedResponse(
            unresolved_id=payload.unresolved_id,
            status="resolved",
            document_id=ingest_result.document_id,
            chunks_created=ingest_result.chunks_created,
            source_ref=ingest_result.source_ref,
        )

    async def get_metrics(self, session: AsyncSession) -> AdminMetricsResponse:
        total_questions = await self.metrics_repo.get_total_questions(session)
        unresolved_open = await self.metrics_repo.get_unresolved_open(session)
        avg_latency_ms = await self.metrics_repo.get_avg_latency_ms(session)
        error_rate = await self.metrics_repo.get_error_rate(session)
        unresolved_rate = await self.metrics_repo.get_unresolved_rate(session)
        return AdminMetricsResponse(
            total_questions=total_questions,
            unresolved_open=unresolved_open,
            avg_latency_ms=avg_latency_ms,
            error_rate=error_rate,
            unresolved_rate=unresolved_rate,
        )

    async def list_recent_conversations(
        self,
        session: AsyncSession,
        *,
        limit: int,
    ) -> ConversationListResponse:
        rows = await self.chat_log_repo.list_recent(session, limit=limit)
        return ConversationListResponse(
            items=[
                ConversationItem(
                    id=row.id,
                    session_id=row.session_id,
                    question_text=row.question_text,
                    answer_text=row.answer_text,
                    latency_ms=row.latency_ms,
                    status=row.status,
                    created_at=row.created_at,
                )
                for row in rows
            ]
        )
