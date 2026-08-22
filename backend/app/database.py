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

        dialect_name = conn.dialect.name

        if dialect_name == "postgresql":
            postgres_statements = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email'",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255)",
                "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL",
                "UPDATE users SET username = SUBSTRING(split_part(email, '@', 1) FROM 1 FOR 60) || '_' || SUBSTRING(id::text FROM 1 FOR 8) WHERE username IS NULL OR username = ''",
                "UPDATE users SET username = 'u_' || SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 32) WHERE username IN (SELECT username FROM users GROUP BY username HAVING COUNT(*) > 1)",
                "UPDATE users SET username = 'user_' || SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 32) WHERE username IS NULL OR username = ''",
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)",
                "CREATE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)",
            ]
            for stmt in postgres_statements:
                await conn.execute(text(stmt))
        else:
            sqlite_statements = [
                "ALTER TABLE users ADD COLUMN username VARCHAR(100)",
                "ALTER TABLE users ADD COLUMN google_id VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email'",
                "ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)",
                "UPDATE users SET username = 'user_' || SUBSTRING(id, 1, 8) WHERE username IS NULL OR username = ''",
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)",
                "CREATE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)",
            ]
            for stmt in sqlite_statements:
                try:
                    await conn.execute(text(stmt))
                except Exception:
                    pass
