from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import field_validator
import os


class Settings(BaseSettings):
    app_name: str = "Calculus API"
    debug: bool = True

    # Database (default to local sqlite file)
    database_url: str = "sqlite+aiosqlite:///./calculus.db"

    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:4173", "https://calculus-mu.vercel.app"]

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

            # 🔥 BẮT BUỘC SSL CHO SUPABASE
            if "postgresql+asyncpg://" in v and "sslmode" not in v:
                if "?" in v:
                    v += "&sslmode=require"
                else:
                    v += "?sslmode=require"

            # SQLite fallback
            if v.endswith(".db") and not v.startswith("sqlite"):
                v = f"sqlite+aiosqlite:///{v}"

        return v


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
