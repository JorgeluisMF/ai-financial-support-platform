from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import require_admin
from app.api.routers import admin, auth, chat, knowledge
from app.api.routers.admin import get_admin_service
from app.api.routers.auth import get_auth_service
from app.api.routers.chat import get_chat_service, get_rate_limiter
from app.api.routers.knowledge import get_ingestion_service
from app.db.session import get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.chat import ChatResponse
from app.schemas.ingestion import IngestResponse, KnowledgeListResponse


class FakeAuthService:
    async def authenticate_user(self, username: str, password: str):
        if username == "admin" and password == "secret123":
            return SimpleNamespace()
        return None

    async def issue_token_pair(self, _user):
        return {
            "access_token": "access-token",
            "refresh_token": "refresh-token-1234567890",
            "expires_in": 3600,
            "token_type": "bearer",
        }


class FakeChatService:
    async def handle_chat(self, payload, session, background_tasks):
        return ChatResponse(
            conversation_id=uuid4(),
            answer=f"Echo: {payload.message}",
            sources=[],
            model_info="fake-model",
            latency_ms=12,
            warnings=["unresolved"],
        )


class FakeRateLimiter:
    max_requests = 10

    async def check(self, _key: str):
        return SimpleNamespace(allowed=True, remaining=9, retry_after_seconds=60)


class FakeAdminService:
    async def get_metrics(self, session):
        return {
            "total_questions": 10,
            "unresolved_open": 2,
            "avg_latency_ms": 100.5,
            "error_rate": 0.1,
            "unresolved_rate": 0.2,
        }

    async def list_unresolved(self, session, page: int, page_size: int):
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "has_more": False,
        }

    async def resolve_unresolved(self, payload, session):
        return {
            "unresolved_id": payload.unresolved_id,
            "status": "resolved",
            "document_id": "doc-1",
            "chunks_created": 1,
            "source_ref": "admin/unresolved/doc-1",
        }

    async def list_recent_conversations(self, session, limit: int):
        return {
            "items": [
                {
                    "id": str(uuid4()),
                    "session_id": "session-1",
                    "question_text": "How can I reset my card PIN?",
                    "answer_text": "Use the banking app settings.",
                    "latency_ms": 90,
                    "status": "success",
                    "created_at": "2026-01-01T00:00:00Z",
                }
            ][:limit]
        }


class FakeIngestionService:
    async def add_text(self, payload, session):
        return IngestResponse(document_id=payload.title, chunks_created=1, source_ref="manual")

    async def add_url(self, payload, session):
        return IngestResponse(document_id=payload.title, chunks_created=1, source_ref=payload.url)

    async def add_file(self, filename, content_type, file_bytes, session):
        return IngestResponse(document_id=filename, chunks_created=1, source_ref=content_type)

    async def list_knowledge(self, session):
        return KnowledgeListResponse(items=[], total=0)

    async def delete_knowledge(self, source_id, session):
        return True


async def fake_db_session():
    yield None


def create_test_app() -> FastAPI:
    app = FastAPI()
    app.include_router(auth.router, prefix="/auth")
    app.include_router(chat.router, prefix="/chat")
    app.include_router(admin.router, prefix="/admin")
    app.include_router(knowledge.router, prefix="/knowledge")
    app.dependency_overrides[get_db_session] = fake_db_session
    app.dependency_overrides[get_auth_service] = lambda: FakeAuthService()
    app.dependency_overrides[get_chat_service] = lambda: FakeChatService()
    app.dependency_overrides[get_rate_limiter] = lambda: FakeRateLimiter()
    app.dependency_overrides[get_admin_service] = lambda: FakeAdminService()
    app.dependency_overrides[get_ingestion_service] = lambda: FakeIngestionService()
    app.dependency_overrides[require_admin] = lambda: CurrentUser(
        user_id=uuid4(),
        username="admin",
        email="admin@example.com",
        role="admin",
        provider="local",
    )
    return app


def test_auth_login_contract():
    client = TestClient(create_test_app())
    response = client.post("/auth/login", json={"username": "admin", "password": "secret123"})
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "access-token"
    assert "refresh_token" in body


def test_chat_contract_includes_unresolved_warning():
    client = TestClient(create_test_app())
    response = client.post(
        "/chat",
        json={
            "session_id": "session-1",
            "user_id": "user-1",
            "message": "Need help",
            "channel": "web",
            "locale": "es-ES",
            "metadata": {},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["warnings"] == ["unresolved"]


def test_admin_conversations_contract():
    client = TestClient(create_test_app())
    response = client.get("/admin/conversations?limit=5")
    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["session_id"] == "session-1"


def test_knowledge_add_text_contract():
    client = TestClient(create_test_app())
    response = client.post(
        "/knowledge/add-text",
        json={
            "title": "Card policy",
            "content": "A" * 40,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["document_id"] == "Card policy"
