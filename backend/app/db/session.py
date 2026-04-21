from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.models.base import Base
from app.db.schema_auth_migrate import ensure_auth_schema
from app.db.schema_knowledge_migrate import ensure_knowledge_schema
from app.db.models.chat_log import ChatLog  # noqa: F401
from app.db.models.document import Document  # noqa: F401
from app.db.models.knowledge_chunk import KnowledgeChunk  # noqa: F401
from app.db.models.knowledge_source import KnowledgeSource  # noqa: F401
from app.db.models.refresh_token import RefreshToken  # noqa: F401
from app.db.models.text_entry import TextEntry  # noqa: F401
from app.db.models.unresolved_question import UnresolvedQuestion  # noqa: F401
from app.db.models.url_entry import UrlEntry  # noqa: F401
from app.db.models.user import User  # noqa: F401

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db(*, include_migrations: bool = True) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        if include_migrations:
            await ensure_auth_schema(conn)
            await ensure_knowledge_schema(conn)
