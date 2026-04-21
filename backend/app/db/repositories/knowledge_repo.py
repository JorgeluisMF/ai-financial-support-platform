import json
from typing import Any

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import Document
from app.db.models.knowledge_chunk import KnowledgeChunk
from app.db.models.knowledge_source import KnowledgeSource
from app.db.models.text_entry import TextEntry
from app.db.models.url_entry import UrlEntry


class KnowledgeRepository:
    async def create_source(
        self,
        session: AsyncSession,
        *,
        source_type: str,
        title: str,
        source_ref: str,
        owner_user_id: str | None = None,
    ) -> KnowledgeSource:
        source = KnowledgeSource(
            source_type=source_type,
            title=title,
            source_ref=source_ref,
            owner_user_id=owner_user_id,
        )
        session.add(source)
        await session.flush()
        return source

    async def create_document(
        self,
        session: AsyncSession,
        *,
        knowledge_source_id: str,
        filename: str,
        mime_type: str,
        size_bytes: int,
    ) -> None:
        session.add(
            Document(
                knowledge_source_id=knowledge_source_id,
                filename=filename,
                mime_type=mime_type,
                size_bytes=size_bytes,
            )
        )

    async def create_url_entry(
        self, session: AsyncSession, *, knowledge_source_id: str, url: str
    ) -> None:
        session.add(UrlEntry(knowledge_source_id=knowledge_source_id, url=url))

    async def create_text_entry(
        self, session: AsyncSession, *, knowledge_source_id: str, content: str
    ) -> None:
        session.add(TextEntry(knowledge_source_id=knowledge_source_id, content=content))

    async def insert_chunks(self, session: AsyncSession, chunks: list[dict[str, Any]]) -> int:
        session.add_all(
            [
                KnowledgeChunk(
                    knowledge_source_id=chunk.get("knowledge_source_id"),
                    document_id=chunk["document_id"],
                    chunk_text=chunk["chunk_text"],
                    embedding=chunk["embedding"],
                    source_type=chunk["source_type"],
                    source_ref=chunk["source_ref"],
                    version=chunk["version"],
                    tags=chunk["tags"],
                )
                for chunk in chunks
            ]
        )
        return len(chunks)

    async def search_similar(
        self,
        session: AsyncSession,
        query_embedding: list[float],
        top_k: int = 3,
    ) -> list[dict[str, Any]]:
        sql = text(
            """
            SELECT
                id AS chunk_id,
                source_ref,
                chunk_text AS content,
                (1 - (embedding <=> CAST(:embedding AS vector))) AS score
            FROM knowledge_chunks
            WHERE knowledge_source_id IS NOT NULL
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
            """
        )
        params = {
            "embedding": json.dumps(query_embedding),
            "top_k": top_k,
        }
        result = await session.execute(sql, params)
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    async def list_sources(self, session: AsyncSession) -> list[dict[str, Any]]:
        stmt = (
            select(
                KnowledgeSource.id,
                KnowledgeSource.source_type,
                KnowledgeSource.title,
                KnowledgeSource.source_ref,
                KnowledgeSource.created_at,
                func.count(KnowledgeChunk.id).label("chunks"),
                func.min(KnowledgeChunk.document_id).label("document_id"),
            )
            .outerjoin(KnowledgeChunk, KnowledgeChunk.knowledge_source_id == KnowledgeSource.id)
            .group_by(
                KnowledgeSource.id,
                KnowledgeSource.source_type,
                KnowledgeSource.title,
                KnowledgeSource.source_ref,
                KnowledgeSource.created_at,
            )
            .order_by(KnowledgeSource.created_at.desc())
        )
        result = await session.execute(stmt)
        rows = result.all()
        return [
            {
                "id": str(row.id),
                "source_type": row.source_type,
                "title": row.title,
                "source_ref": row.source_ref,
                "chunks": row.chunks or 0,
                "document_id": row.document_id or "",
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]

    async def delete_source(self, session: AsyncSession, source_id: str) -> bool:
        await session.execute(delete(KnowledgeChunk).where(KnowledgeChunk.knowledge_source_id == source_id))
        result = await session.execute(delete(KnowledgeSource).where(KnowledgeSource.id == source_id))
        await session.commit()
        return (result.rowcount or 0) > 0
