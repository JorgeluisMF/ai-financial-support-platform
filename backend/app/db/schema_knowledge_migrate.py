"""Idempotent PostgreSQL adjustments for knowledge schema.

`create_all` does not ALTER existing tables; this runs after create_all.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_knowledge_schema(conn: AsyncConnection) -> None:
    # Older databases can miss this nullable FK-like column required by current ORM queries.
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'knowledge_chunks'
                      AND column_name = 'knowledge_source_id'
                ) THEN
                    ALTER TABLE knowledge_chunks
                    ADD COLUMN knowledge_source_id UUID NULL;
                END IF;
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_knowledge_chunks_knowledge_source_id
            ON knowledge_chunks (knowledge_source_id);
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_knowledge_chunks_knowledge_source_id'
                ) THEN
                    ALTER TABLE knowledge_chunks
                    ADD CONSTRAINT fk_knowledge_chunks_knowledge_source_id
                    FOREIGN KEY (knowledge_source_id)
                    REFERENCES knowledge_sources(id)
                    ON DELETE SET NULL;
                END IF;
            END $$;
            """
        )
    )
