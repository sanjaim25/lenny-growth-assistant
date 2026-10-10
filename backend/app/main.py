from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db, engine
from app.config import settings
from app.api import sessions, knowledge

app = FastAPI(title="The Lenny Growth Assistant API", version="1.0.0")

app.include_router(sessions.router)
app.include_router(knowledge.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "disconnected"
    try:
        # Simple query to test connectivity
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "ollama_base_url": settings.OLLAMA_BASE_URL
    }
