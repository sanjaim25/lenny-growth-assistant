from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
import os
from app.config import settings

# Use NullPool during pytest to avoid InterfaceError from concurrent tests
# Otherwise use standard QueuePool
is_testing = os.getenv("TESTING", "0") == "1"
pool_class = NullPool if is_testing else AsyncAdaptedQueuePool

engine = create_async_engine(settings.DATABASE_URL, echo=False, poolclass=pool_class)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
