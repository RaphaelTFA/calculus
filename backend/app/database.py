from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

database_url = settings.database_url

engine_kwargs = {
    "echo": settings.debug,
    "pool_pre_ping": True,
}


if database_url.startswith("postgresql+asyncpg://"):
    engine_kwargs["connect_args"] = {
        "ssl": "require",
        "statement_cache_size": 0,
    }

engine = create_async_engine(database_url, **engine_kwargs)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    # Import all models so they are registered with Base.metadata before create_all
    from app import models  # noqa: F401
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Run each migration in its own transaction so a failure (e.g. column already
    # exists) cannot roll back the create_all above.
    _migrations = [
        "ALTER TABLE users ADD COLUMN hearts INTEGER DEFAULT 5",
        "ALTER TABLE users ADD COLUMN last_heart_restore_at TIMESTAMP",
        "ALTER TABLE streak_weeks ADD COLUMN frozen_days JSON",
    ]
    for sql in _migrations:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
        except Exception:
            pass  # column already exists
