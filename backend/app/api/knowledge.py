from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.database import get_db
from app.models.schema import Document, Chunk

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

class KnowledgeStatusResponse(BaseModel):
    document_count: int
    chunk_count: int
    embedding_model: str
    status: str

@router.get("/status", response_model=KnowledgeStatusResponse)
async def get_status(db: AsyncSession = Depends(get_db)):
    doc_count = await db.scalar(select(func.count()).select_from(Document))
    chunk_count = await db.scalar(select(func.count()).select_from(Chunk))
    
    return KnowledgeStatusResponse(
        document_count=doc_count or 0,
        chunk_count=chunk_count or 0,
        embedding_model="nomic-embed-text",
        status="ready" if doc_count and chunk_count else "empty"
    )
