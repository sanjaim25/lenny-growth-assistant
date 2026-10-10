import hashlib
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.schema import Document, Chunk
from app.rag.loader import load_transcripts
from app.rag.chunker import chunk_text
from app.rag.embedder import get_embedding

logger = logging.getLogger(__name__)

def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

async def ingest_transcripts(data_dir: str, db: AsyncSession):
    """
    Idempotent ingestion pipeline for transcripts.
    """
    documents = load_transcripts(data_dir)
    logger.info(f"Loaded {len(documents)} documents from {data_dir}")
    
    for doc_data in documents:
        # Check if document already exists based on source_url or title
        # In a real app, we might use a dedicated 'content_hash' column.
        # Here we can fetch the existing document by title to check if we need to reingest.
        stmt = select(Document).filter(Document.title == doc_data["title"])
        result = await db.execute(stmt)
        existing_doc = result.scalar_one_or_none()
        
        # If it exists, we could check if the content changed.
        # For idempotency, if it exists, let's compare raw_content hash.
        # Since we don't have a hash column, we'll hash the current raw_content.
        if existing_doc:
            existing_hash = compute_hash(existing_doc.raw_content)
            new_hash = compute_hash(doc_data["raw_content"])
            if existing_hash == new_hash:
                logger.info(f"Skipping unchanged document: {doc_data['title']}")
                continue
            
            # Content changed, delete old document (cascade deletes chunks)
            logger.info(f"Updating document: {doc_data['title']}")
            await db.delete(existing_doc)
            await db.commit() # commit deletion first to avoid uniqueness issues if any
            
        # Create new document
        logger.info(f"Ingesting document: {doc_data['title']}")
        new_doc = Document(
            title=doc_data["title"],
            source_url=doc_data["source_url"],
            raw_content=doc_data["raw_content"]
        )
        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)
        
        # Chunk and embed
        text_chunks = chunk_text(doc_data["raw_content"], chunk_size=500, chunk_overlap=50)
        
        for i, text_chunk in enumerate(text_chunks):
            embedding = await get_embedding(text_chunk)
            
            chunk = Chunk(
                document_id=new_doc.id,
                content=text_chunk,
                embedding=embedding
            )
            db.add(chunk)
            
        await db.commit()
        logger.info(f"Saved {len(text_chunks)} chunks for document: {doc_data['title']}")
        
    logger.info("Ingestion complete.")
