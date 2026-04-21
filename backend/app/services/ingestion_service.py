import io
import re
import uuid
import zipfile
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import EmbeddingClient
from app.core.cache import ChatCache
from app.db.repositories.knowledge_repo import KnowledgeRepository
from app.ingestion.chunker import split_text_into_chunks
from app.schemas.ingestion import (
    AddTextRequest,
    AddUrlRequest,
    IngestRequest,
    IngestResponse,
    KnowledgeItem,
    KnowledgeListResponse,
)


class _HTMLToTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.meta_parts: list[str] = []
        self.skip = False
        self.in_title = False

    def handle_starttag(self, tag: str, attrs) -> None:  # type: ignore[override]
        attrs_dict = dict(attrs)
        if tag in {"script", "style"}:
            self.skip = True
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            name = (attrs_dict.get("name") or attrs_dict.get("property") or "").strip().lower()
            content = (attrs_dict.get("content") or "").strip()
            if not content:
                return
            allowed = {
                "description",
                "og:description",
                "twitter:description",
                "og:title",
                "twitter:title",
            }
            if name in allowed:
                self.meta_parts.append(content)

    def handle_endtag(self, tag: str) -> None:  # type: ignore[override]
        if tag in {"script", "style"}:
            self.skip = False
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:  # type: ignore[override]
        if not self.skip or self.in_title:
            self.parts.append(data)

    def get_text(self) -> str:
        # Put meta descriptions first for JS-heavy pages with sparse body text.
        return " ".join(self.meta_parts + self.parts)


class IngestionService:
    def __init__(self) -> None:
        self.embedding_client = EmbeddingClient()
        self.knowledge_repo = KnowledgeRepository()
        self.chat_cache = ChatCache()

    async def ingest_document(
        self,
        payload: IngestRequest,
        session: AsyncSession,
    ) -> IngestResponse:
        chunks = split_text_into_chunks(
            text=payload.content,
            chunk_size=payload.chunk_size,
            chunk_overlap=payload.chunk_overlap,
        )
        if not chunks:
            raise ValueError("Document content did not produce chunks")

        chunk_records: list[dict] = []
        for chunk in chunks:
            embedding = await self.embedding_client.embed_text(chunk)
            chunk_records.append(
                {
                    "document_id": payload.document_id,
                    "chunk_text": chunk,
                    "embedding": embedding,
                    "source_type": payload.source_type,
                    "source_ref": payload.source_ref,
                    "version": payload.version,
                    "tags": payload.tags,
                }
            )

        created = await self.knowledge_repo.insert_chunks(session, chunk_records)
        return IngestResponse(
            document_id=payload.document_id,
            chunks_created=created,
            source_ref=payload.source_ref,
        )

    async def add_text(self, payload: AddTextRequest, session: AsyncSession) -> IngestResponse:
        source = await self.knowledge_repo.create_source(
            session, source_type="text", title=payload.title, source_ref=f"text:{payload.title}"
        )
        await self.knowledge_repo.create_text_entry(
            session, knowledge_source_id=source.id, content=payload.content
        )
        ingest = IngestRequest(
            document_id=f"text-{uuid.uuid4().hex[:12]}",
            source_type="text",
            source_ref=f"text:{payload.title}",
            content=payload.content,
            version="v1",
            tags={},
            chunk_size=600,
            chunk_overlap=120,
        )
        response = await self.ingest_document(ingest, session)
        await self._link_last_chunks_to_source(session, response.document_id, source.id)
        await session.commit()
        await self.chat_cache.clear_response_cache()
        return response

    async def add_url(self, payload: AddUrlRequest, session: AsyncSession) -> IngestResponse:
        raw = await self._fetch_url_text(payload.url)
        source = await self.knowledge_repo.create_source(
            session, source_type="url", title=payload.title, source_ref=payload.url
        )
        await self.knowledge_repo.create_url_entry(session, knowledge_source_id=source.id, url=payload.url)
        domain = urlparse(payload.url).netloc
        ingest = IngestRequest(
            document_id=f"url-{uuid.uuid4().hex[:12]}",
            source_type="url",
            source_ref=payload.url,
            content=raw,
            version="v1",
            tags={"domain": domain},
            chunk_size=600,
            chunk_overlap=120,
        )
        response = await self.ingest_document(ingest, session)
        await self._link_last_chunks_to_source(session, response.document_id, source.id)
        await session.commit()
        await self.chat_cache.clear_response_cache()
        return response

    async def add_file(
        self, *, filename: str, content_type: str, file_bytes: bytes, session: AsyncSession
    ) -> IngestResponse:
        extracted = self._extract_file_text(filename, file_bytes)
        source = await self.knowledge_repo.create_source(
            session, source_type="document", title=filename, source_ref=filename
        )
        await self.knowledge_repo.create_document(
            session,
            knowledge_source_id=source.id,
            filename=filename,
            mime_type=content_type or "application/octet-stream",
            size_bytes=len(file_bytes),
        )
        ingest = IngestRequest(
            document_id=f"doc-{uuid.uuid4().hex[:12]}",
            source_type="document",
            source_ref=filename,
            content=extracted,
            version="v1",
            tags={"filename": filename},
            chunk_size=600,
            chunk_overlap=120,
        )
        response = await self.ingest_document(ingest, session)
        await self._link_last_chunks_to_source(session, response.document_id, source.id)
        await session.commit()
        await self.chat_cache.clear_response_cache()
        return response

    async def list_knowledge(self, session: AsyncSession) -> KnowledgeListResponse:
        rows = await self.knowledge_repo.list_sources(session)
        items = [KnowledgeItem(**row) for row in rows]
        return KnowledgeListResponse(items=items, total=len(items))

    async def delete_knowledge(self, source_id: str, session: AsyncSession) -> bool:
        deleted = await self.knowledge_repo.delete_source(session, source_id)
        if deleted:
            await self.chat_cache.clear_response_cache()
        return deleted

    async def _link_last_chunks_to_source(
        self, session: AsyncSession, document_id: str, source_id: str
    ) -> None:
        from sqlalchemy import update

        from app.db.models.knowledge_chunk import KnowledgeChunk

        await session.execute(
            update(KnowledgeChunk)
            .where(KnowledgeChunk.document_id == document_id)
            .values(knowledge_source_id=source_id)
        )

    async def _fetch_url_text(self, url: str) -> str:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url)
        response.raise_for_status()
        parser = _HTMLToTextParser()
        parser.feed(response.text)
        text = unescape(parser.get_text())
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 20:
            raise ValueError("URL content is too short to ingest")
        return text

    def _extract_file_text(self, filename: str, content: bytes) -> str:
        lower = filename.lower()
        if lower.endswith(".txt"):
            text = content.decode("utf-8", errors="ignore")
        elif lower.endswith(".docx"):
            text = self._extract_docx_text(content)
        elif lower.endswith(".pdf"):
            try:
                from pypdf import PdfReader
            except ImportError as exc:
                raise ValueError("PDF support is not installed on the backend") from exc
            reader = PdfReader(io.BytesIO(content))
            text = " ".join((page.extract_text() or "") for page in reader.pages)
        else:
            raise ValueError("Unsupported file type")
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 20:
            raise ValueError("File does not contain enough readable text")
        return text

    def _extract_docx_text(self, content: bytes) -> str:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
        xml = re.sub(r"<[^>]+>", " ", xml)
        return unescape(xml)
