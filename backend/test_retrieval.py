import asyncio
import json
from app.database import AsyncSessionLocal
from app.rag.retriever import retrieve_relevant_chunks

async def main():
    queries = [
        "What is the best way to close enterprise deals?",
        "How to build high talent density teams?",
        "How to bake a chocolate cake with strawberries" # Unrelated query
    ]
    
    async with AsyncSessionLocal() as session:
        for q in queries:
            print(f"\nQuery: {q}")
            results = await retrieve_relevant_chunks(q, session, top_k=2, similarity_threshold=0.3)
            if not results:
                print("No relevant chunks found.")
            for r in results:
                print(f"- Episode: {r['episode_title']} (Score: {r['similarity_score']:.4f})")
                print(f"  URL: {r['source_url']}")
                print(f"  Snippet: {r['content'][:100]}...\n")

if __name__ == "__main__":
    asyncio.run(main())
