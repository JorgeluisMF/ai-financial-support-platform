from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=3, max_length=128)
    user_id: str = Field(min_length=3, max_length=128)
    message: str = Field(min_length=1, max_length=4000)
    channel: str = Field(default="web", max_length=50)
    locale: str = Field(default="es-ES", max_length=10)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SourceItem(BaseModel):
    chunk_id: UUID
    source_ref: str
    score: float


class ChatResponse(BaseModel):
    conversation_id: UUID = Field(default_factory=uuid4)
    answer: str
    sources: list[SourceItem]
    model_info: str
    latency_ms: int
    warnings: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
