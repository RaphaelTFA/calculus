from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import field_validator
import os

class Settings(BaseSettings):
    app_name: str = "Calculus API"
    debug: bool = True

    # Email settings
    email_sender: str = os.getenv("SENDER_EMAIL")
    email_password: str = os.getenv("SENDER_PASSWORD") 

    # Database (default to local sqlite file)
    database_url: str = "sqlite+aiosqlite:///./calculus.db"

    # JWT
    secret_key: str = os.getenv("JWT_SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    email_verification_token_expire_minutes: int = 60 * 24  # 24 hours

    # URLs used in emails
    backend_base_url: str = "http://localhost:8000"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:4173",
        "https://calculus-mu.vercel.app",
    ]

    class Config:
        env_file = ".env"

    @field_validator("database_url", mode="before")
    def _normalize_database_url(cls, v):
        import os

        if not v:
            v = (
                os.environ.get("DATABASE_URL")
                or os.environ.get("RENDER_DATABASE_URL")
                or os.environ.get("database_url")
            )

        if not v:
            return "sqlite+aiosqlite:///./calculus.db"

        if isinstance(v, str):

            # Convert to asyncpg
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)

            elif v.startswith("postgresql://") and "+asyncpg" not in v:
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)

            # SQLite fallback
            if v.endswith(".db") and not v.startswith("sqlite"):
                v = f"sqlite+aiosqlite:///{v}"
        print(f"Normalized database URL: {v}")
        return v


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
