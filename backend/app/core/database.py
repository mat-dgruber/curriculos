from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=(settings.environment == "development"),
)

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
    """
    Cria as tabelas no banco de dados se elas não existirem de forma automatizada no startup.
    Também adiciona de forma autogestora colunas recém-adicionadas para atualização suave.
    """
    import os
    if settings.database_url.startswith("sqlite"):
        db_path = settings.database_url.split("///")[-1]
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    from app.models.rejected_job import RejectedJob  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Self-healing migration for SQLite columns
        try:
            # Check existing columns in candidate_profiles
            import sqlalchemy
            result = await conn.execute(sqlalchemy.text("PRAGMA table_info(candidate_profiles)"))
            columns = [row[1] for row in result.all()]
            
            if "cv_extracted_text" not in columns:
                await conn.execute(sqlalchemy.text("ALTER TABLE candidate_profiles ADD COLUMN cv_extracted_text TEXT"))
            if "is_paused" not in columns:
                await conn.execute(sqlalchemy.text("ALTER TABLE candidate_profiles ADD COLUMN is_paused BOOLEAN NOT NULL DEFAULT 0"))
            if "paused_until" not in columns:
                await conn.execute(sqlalchemy.text("ALTER TABLE candidate_profiles ADD COLUMN paused_until DATETIME"))
        except Exception:
            pass
