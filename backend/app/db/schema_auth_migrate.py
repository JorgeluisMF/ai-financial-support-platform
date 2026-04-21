"""Idempotent PostgreSQL adjustments for auth (OAuth).

`create_all` does not ALTER existing tables; this runs after create_all.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_auth_schema(conn: AsyncConnection) -> None:
    # Bases creadas antes del modelo actual pueden no tener `username`; el ORM lo exige.
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username'
                ) THEN
                    ALTER TABLE users ADD COLUMN username VARCHAR(64) NULL;
                    UPDATE users SET username = left(
                        regexp_replace(
                            lower(split_part(coalesce(email, 'user'), '@', 1)),
                            '[^a-z0-9._-]',
                            '_',
                            'g'
                        ) || '_' || left(replace(id::text, '-', ''), 12),
                        64
                    )
                    WHERE username IS NULL;
                    ALTER TABLE users ALTER COLUMN username SET NOT NULL;
                END IF;
            END $$;
            """
        )
    )
    # Normaliza roles legacy para soportar solo admin/agent.
    await conn.execute(
        text(
            """
            UPDATE users
            SET role = CASE
                WHEN lower(coalesce(role, '')) = 'admin' THEN 'admin'
                ELSE 'agent'
            END;
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE users
            ALTER COLUMN role SET DEFAULT 'agent';
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'ck_users_role_allowed'
                ) THEN
                    ALTER TABLE users DROP CONSTRAINT ck_users_role_allowed;
                END IF;
                ALTER TABLE users
                ADD CONSTRAINT ck_users_role_allowed
                CHECK (role IN ('admin', 'agent'));
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);",
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'provider'
                ) THEN
                    ALTER TABLE users ADD COLUMN provider VARCHAR(32) NOT NULL DEFAULT 'local';
                END IF;
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'provider_id'
                ) THEN
                    ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) NULL;
                END IF;
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_verified'
                ) THEN
                    ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT true;
                END IF;
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
                ) THEN
                    ALTER TABLE users ADD COLUMN avatar_url TEXT NULL;
                END IF;
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users'
                      AND column_name = 'password_hash' AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
                END IF;
            END $$;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_provider_id
            ON users (provider_id)
            WHERE provider = 'google' AND provider_id IS NOT NULL;
            """
        )
    )
