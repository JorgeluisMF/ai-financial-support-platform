from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db_session
from app.schemas.admin import (
    AdminMetricsResponse,
    ConversationListResponse,
    ResolveUnresolvedRequest,
    ResolveUnresolvedResponse,
    UnresolvedListResponse,
)
from app.schemas.ingestion import IngestRequest, IngestResponse
from app.services.admin_service import AdminService
from app.services.ingestion_service import IngestionService

router = APIRouter(dependencies=[Depends(require_admin)])


def get_ingestion_service() -> IngestionService:
    return IngestionService()


def get_admin_service() -> AdminService:
    return AdminService()


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    summary="List recent conversations",
)
async def list_conversations(
    limit: int = 25,
    session: AsyncSession = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
) -> ConversationListResponse:
    safe_limit = min(max(limit, 1), 100)
    return await service.list_recent_conversations(session=session, limit=safe_limit)


@router.get(
    "/metrics",
    response_model=AdminMetricsResponse,
    summary="Get operational metrics",
)
async def get_metrics(
    session: AsyncSession = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
) -> AdminMetricsResponse:
    return await service.get_metrics(session=session)


@router.get(
    "/unresolved",
    response_model=UnresolvedListResponse,
    summary="List unresolved questions",
)
async def list_unresolved(
    page: int = 1,
    page_size: int = 10,
    session: AsyncSession = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
) -> UnresolvedListResponse:
    safe_page = max(page, 1)
    safe_page_size = min(max(page_size, 1), 100)
    return await service.list_unresolved(
        session=session,
        page=safe_page,
        page_size=safe_page_size,
    )


@router.post(
    "/resolve",
    response_model=ResolveUnresolvedResponse,
    summary="Resolve unresolved question and ingest knowledge",
)
async def resolve_unresolved(
    payload: ResolveUnresolvedRequest,
    session: AsyncSession = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
) -> ResolveUnresolvedResponse:
    try:
        return await service.resolve_unresolved(payload, session=session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Resolve operation failed") from exc


@router.post("/ingest", response_model=IngestResponse, summary="Ingest knowledge document")
async def ingest_document(
    payload: IngestRequest,
    session: AsyncSession = Depends(get_db_session),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestResponse:
    try:
        return await service.ingest_document(payload, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Knowledge ingestion failed") from exc
