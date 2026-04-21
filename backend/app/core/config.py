from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Financial Customer Support Agent"
    app_version: str = "0.1.0"
    environment: str = "development"
    cors_allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    gemini_api_key: str = "replace-me"
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    llm_provider: str = "gemini"
    embedding_provider: str = "gemini"
    llm_fallback_provider: str | None = None
    embedding_fallback_provider: str | None = None

    openai_api_key: str | None = None
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    groq_api_key: str | None = None
    groq_chat_model: str = "llama-3.1-8b-instant"

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/agent_db"
    )

    chat_prompt_version: str = "v1"
    user_id_hash_pepper: str = ""

    unresolved_score_threshold: float = 0.25
    unresolved_negative_phrases: str = (
        "i don't have enough information,insufficient information,"
        "i cannot answer,not enough context,no sufficient information"
    )
    jwt_secret_key: str = "replace-me-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 14
    jwt_issuer: str = "ai-agent-platform"
    jwt_audience: str = "ai-agent-frontend"

    # OAuth
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_oauth_redirect_uri: str = "http://127.0.0.1:8000/auth/google/callback"
    frontend_oauth_success_url: str = "http://127.0.0.1:5173/auth/callback"
    default_sso_role: str = "agent"

    redis_url: str = "redis://localhost:6379/0"
    run_db_migrations_on_startup: bool = True
    chat_cache_ttl_seconds: int = 300
    rate_limit_requests: int = 10
    rate_limit_window_seconds: int = 60
    sanitization_max_length: int = 4000
    sanitization_block_patterns: str = (
        "ignore previous instructions,system prompt,developer prompt,"
        "reveal hidden instructions,bypass safety,do anything now,"
        "<script,</script,union select,drop table"
    )
    sanitization_mask_replacement: str = "[REDACTED]"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
