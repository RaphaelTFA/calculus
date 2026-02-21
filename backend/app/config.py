from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "Calculus API"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./calculus.db"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:4173", "https://calculus-mu.vercel.app"]
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
