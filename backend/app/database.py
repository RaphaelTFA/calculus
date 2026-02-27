from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

database_url = settings.database_url

engine_kwargs = {
    "echo": settings.debug,
    "pool_pre_ping": True,
}


if database_url.startswith("postgresql+asyncpg://"):
    engine_kwargs["connect_args"] = {"ssl": "require"}

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
