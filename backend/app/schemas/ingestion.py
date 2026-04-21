from typing import Any

from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    document_id: str = Field(min_length=3, max_length=128)
    source_type: str = Field(default="policy", max_length=50)
    source_ref: str = Field(min_length=3, max_length=255)
    version: str = Field(default="v1", max_length=50)
    content: str = Field(min_length=20, max_length=500_000)
    tags: dict[str, Any] = Field(default_factory=dict)
    chunk_size: int = Field(default=600, ge=200, le=2000)
    chunk_overlap: int = Field(default=120, ge=0, le=500)


class IngestResponse(BaseModel):
    document_id: str
    chunks_created: int
    source_ref: str


class AddTextRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=20, max_length=500_000)


class AddUrlRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    url: str = Field(min_length=8, max_length=2000)


class KnowledgeItem(BaseModel):
    id: str
    document_id: str
    title: str
    source_type: str
    source_ref: str
    chunks: int
    created_at: str


class KnowledgeListResponse(BaseModel):
    items: list[KnowledgeItem]
    total: int
