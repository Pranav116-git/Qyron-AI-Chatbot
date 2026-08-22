from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


from sqlalchemy import text


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        migrations = [
            "ALTER TABLE users ADD COLUMN google_id VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email'",
            "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL",
        ]
        for stmt in migrations:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass
