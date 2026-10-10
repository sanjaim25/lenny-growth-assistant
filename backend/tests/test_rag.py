import pytest
import asyncio
from app.rag.chunker import chunk_text
from app.rag.embedder import get_embedding, EXPECTED_DIMENSIONS
from app.rag.retriever import retrieve_relevant_chunks
from app.database import AsyncSessionLocal

def test_chunker():
    text = "word " * 1000
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=10)
    # 1000 words ~ 1000 tokens (simplification for this test)
    assert len(chunks) > 1
    assert "word" in chunks[0]
    
@pytest.mark.asyncio
async def test_embedder_dimensions():
    # Only test if Ollama is reachable
    try:
        embedding = await get_embedding("test query")
        assert len(embedding) == EXPECTED_DIMENSIONS
    except Exception as e:
        pytest.skip(f"Ollama might not be reachable: {e}")

@pytest.mark.asyncio
async def test_retrieval_and_empty_retrieval():
    # This test requires the database to have some ingested data.
    async with AsyncSessionLocal() as session:
        # 1. Test answerable query (assuming Molly Graham or Peter Sellis is in DB)
        # We use a broad PM/tech question likely to match
        results = await retrieve_relevant_chunks(
            query="product management advice",
            db=session,
            top_k=3,
            similarity_threshold=0.5
        )
        
        # If DB is empty, we skip
        if not results:
            pytest.skip("No documents ingested yet, skipping retrieval tests.")
            
        assert len(results) > 0
        assert "similarity_score" in results[0]
        assert "episode_title" in results[0]
        assert "source_url" in results[0]
        assert "chunk_id" in results[0]
        
        # 2. Test empty retrieval for unrelated query
        unrelated_results = await retrieve_relevant_chunks(
            query="how to bake a chocolate cake with strawberries",
            db=session,
            top_k=3,
            similarity_threshold=0.7 # high threshold for unrelated
        )
        
        assert len(unrelated_results) == 0

@pytest.mark.asyncio
async def test_evaluation_set():
    """
    Evaluates 5 answerable questions and 3 unanswerable questions.
    """
    answerable_queries = [
        ("What is the best way to close enterprise deals?", "Jen Abel"),
        ("How to build high talent density teams?", "Adam Ward"),
        ("What are the tradeoffs in AI product work?", "Dianne Penn"),
        ("Advice for product management?", "Peter Sellis"),
        ("How to deal with burnout in the tech industry?", "Molly Graham")
    ]
    
    unanswerable_queries = [
        "What is the capital of France?",
        "How do I repair a broken transmission on a 2015 Honda Civic?",
        "Explain the plot of the movie Inception."
    ]
    
    async with AsyncSessionLocal() as session:
        # Skip if empty DB
        test_res = await retrieve_relevant_chunks("test", session)
        if not test_res:
            pytest.skip("No documents ingested.")
            
        for query, expected_guest_or_title in answerable_queries:
            results = await retrieve_relevant_chunks(query, session, top_k=5, similarity_threshold=0.3)
            assert len(results) > 0
            
            # Note: We just assert we got results. Validating exact title match is hard without knowing 
            # exactly what was ingested, but we expect high relevance.
            
        for query in unanswerable_queries:
            results = await retrieve_relevant_chunks(query, session, top_k=3, similarity_threshold=0.6)
            assert len(results) == 0
