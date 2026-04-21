from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class UnresolvedItem(BaseModel):
    id: UUID
    chat_log_id: UUID
    session_id: str
    question_text: str
    answer_text: str
    reason: str
    top_retrieval_score: float | None
    retrieved_chunk_count: int
    status: str
    created_at: datetime


class UnresolvedListResponse(BaseModel):
    items: list[UnresolvedItem]
    total: int
    page: int
    page_size: int
    has_more: bool


class ResolveUnresolvedRequest(BaseModel):
    unresolved_id: UUID
    document_id: str | None = Field(default=None, min_length=3, max_length=128)
    source_type: str = Field(default="policy", max_length=50)
    source_ref: str | None = Field(default=None, min_length=3, max_length=255)
    version: str = Field(default="v1", max_length=50)
    content: str = Field(min_length=20, max_length=500_000)
    tags: dict[str, Any] = Field(default_factory=dict)
    chunk_size: int = Field(default=600, ge=200, le=2000)
    chunk_overlap: int = Field(default=120, ge=0, le=500)


class ResolveUnresolvedResponse(BaseModel):
    unresolved_id: UUID
    status: str
    document_id: str
    chunks_created: int
    source_ref: str


class AdminMetricsResponse(BaseModel):
    total_questions: int
    unresolved_open: int
    avg_latency_ms: float
    error_rate: float
    unresolved_rate: float


class ConversationItem(BaseModel):
    id: UUID
    session_id: str
    question_text: str
    answer_text: str
    latency_ms: int
    status: str
    created_at: datetime


class ConversationListResponse(BaseModel):
    items: list[ConversationItem]
