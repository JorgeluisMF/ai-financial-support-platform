from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.knowledge_repo import KnowledgeRepository

class RetrievalClient:
    def __init__(self) -> None:
        self.knowledge_repo = KnowledgeRepository()

    async def retrieve(self, embedding: list[float], session: AsyncSession) -> list[dict]:
        return await self.knowledge_repo.search_similar(
            session=session,
            query_embedding=embedding,
            top_k=3,
        )
