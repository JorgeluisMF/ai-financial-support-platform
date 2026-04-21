-- Run manually against existing PostgreSQL if you prefer not to rely on app startup migration.
-- Safe to run multiple times.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(64);
UPDATE users SET username = left(
    regexp_replace(
        lower(split_part(coalesce(email, 'user'), '@', 1)),
        '[^a-z0-9._-]',
        '_',
        'g'
    ) || '_' || left(replace(id::text, '-', ''), 12),
    64
)
WHERE username IS NULL OR trim(username) = '';
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);

ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(32) NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_provider_id
ON users (provider_id)
WHERE provider = 'google' AND provider_id IS NOT NULL;
