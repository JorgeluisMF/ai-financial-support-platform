from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db_session
from app.schemas.ingestion import AddTextRequest, AddUrlRequest, IngestResponse, KnowledgeListResponse
from app.services.ingestion_service import IngestionService

router = APIRouter(dependencies=[Depends(require_admin)])


def get_ingestion_service() -> IngestionService:
    return IngestionService()


@router.post("/upload-file", response_model=IngestResponse)
async def upload_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestResponse:
    try:
        payload = await file.read()
        return await service.add_file(
            filename=file.filename or "uploaded-file",
            content_type=file.content_type or "application/octet-stream",
            file_bytes=payload,
            session=session,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="File ingestion failed") from exc


@router.post("/add-url", response_model=IngestResponse)
async def add_url(
    payload: AddUrlRequest,
    session: AsyncSession = Depends(get_db_session),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestResponse:
    try:
        return await service.add_url(payload, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="URL ingestion failed") from exc


@router.post("/add-text", response_model=IngestResponse)
async def add_text(
    payload: AddTextRequest,
    session: AsyncSession = Depends(get_db_session),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestResponse:
    try:
        return await service.add_text(payload, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Text ingestion failed") from exc


@router.get("", response_model=KnowledgeListResponse)
async def list_knowledge(
    session: AsyncSession = Depends(get_db_session),
    service: IngestionService = Depends(get_ingestion_service),
) -> KnowledgeListResponse:
    return await service.list_knowledge(session)


@router.delete("/{source_id}")
async def delete_knowledge(
    source_id: str,
    session: AsyncSession = Depends(get_db_session),
    service: IngestionService = Depends(get_ingestion_service),
) -> dict[str, bool]:
    deleted = await service.delete_knowledge(source_id, session)
    if not deleted:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    return {"deleted": True}
