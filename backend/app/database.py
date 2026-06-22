from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.base import Base
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables. Safe to call on every startup — SQLAlchemy checks existence."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
