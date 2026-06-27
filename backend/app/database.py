import os
from pathlib import Path

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.base import Base
from app.config import settings


def _ensure_db_dir(db_url: str) -> str:
    """Extract the file path from a SQLite URL and ensure its parent directory exists.

    Handles both:
      - sqlite+aiosqlite:///./mao-na-massa.db   (relative path)
      - sqlite+aiosqlite:////data/mao-na-massa.db (absolute path)
    """
    prefix = "sqlite+aiosqlite:///"
    if not db_url.startswith(prefix):
        return db_url
    path_str = db_url[len(prefix):]
    db_path = Path(path_str)
    # Railway sometimes sets DATABASE_URL pointing to a volume not yet mounted
    # — ensure the directory exists so SQLite can create the file
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_url


engine = create_async_engine(_ensure_db_dir(settings.database_url), echo=False)


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, _connection_record):
    """Ativa WAL mode e ajusta parâmetros de resiliência do SQLite.

    - WAL: permite leitura concorrente durante escritas, reduz corrupção
    - synchronous=NORMAL: equilibrio segurança/performance no WAL
    - busy_timeout=5000: espera 5s antes de falhar em lock
    - foreign_keys=ON: garante integridade referencial
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables. Safe to call on startup — SQLAlchemy checks existence."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
