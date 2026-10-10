from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from typing import List, Dict, Any

from app.models.schema import Chunk, Document
from app.rag.embedder import get_embedding

async def retrieve_relevant_chunks(
    query: str, 
    db: AsyncSession, 
    top_k: int = 5,
    similarity_threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Retrieves the top_k most relevant chunks using cosine similarity.
    Filters out chunks below the similarity_threshold to prevent unrelated
    evidence from being returned.
    """
    query_embedding = await get_embedding(query)
    
    # pgvector uses `<=>` for cosine distance. Cosine similarity = 1 - cosine distance
    cosine_distance = Chunk.embedding.cosine_distance(query_embedding)
    cosine_similarity = 1 - cosine_distance
    
    stmt = (
        select(Chunk, cosine_similarity.label("similarity"))
        .options(joinedload(Chunk.document))
        .filter(cosine_similarity >= similarity_threshold)
        .order_by(cosine_distance)
        .limit(top_k)
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    results = []
    for row in rows:
        chunk = row.Chunk
        similarity = row.similarity
        results.append({
            "chunk_id": str(chunk.id),
            "content": chunk.content,
            "similarity_score": similarity,
            "episode_title": chunk.document.title,
            "source_url": chunk.document.source_url
        })
        
    return results
