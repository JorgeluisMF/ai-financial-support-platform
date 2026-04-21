from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class MetricsRepository:
    async def get_total_questions(self, session: AsyncSession) -> int:
        result = await session.execute(text("SELECT COUNT(*) FROM chat_logs"))
        return int(result.scalar_one())

    async def get_unresolved_open(self, session: AsyncSession) -> int:
        result = await session.execute(
            text("SELECT COUNT(*) FROM unresolved_questions WHERE status = 'open'")
        )
        return int(result.scalar_one())

    async def get_avg_latency_ms(self, session: AsyncSession) -> float:
        result = await session.execute(
            text("SELECT COALESCE(AVG(latency_ms), 0) FROM chat_logs")
        )
        value = result.scalar_one()
        return float(value)

    async def get_error_rate(self, session: AsyncSession) -> float:
        result = await session.execute(
            text(
                """
                SELECT COALESCE(
                    AVG(CASE WHEN status = 'error' THEN 1.0 ELSE 0.0 END),
                    0
                )
                FROM chat_logs
                """
            )
        )
        return float(result.scalar_one())

    async def get_unresolved_rate(self, session: AsyncSession) -> float:
        result = await session.execute(
            text(
                """
                SELECT COALESCE(
                    (
                        SELECT COUNT(*)::float FROM unresolved_questions
                    ) / NULLIF(
                        (SELECT COUNT(*)::float FROM chat_logs),
                        0
                    ),
                    0
                )
                """
            )
        )
        return float(result.scalar_one())
