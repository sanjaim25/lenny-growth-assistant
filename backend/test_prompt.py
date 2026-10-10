import asyncio
import httpx
from app.database import AsyncSessionLocal
from app.rag.retriever import retrieve_relevant_chunks

async def main():
    query = "How to bake a chocolate cake with strawberries"
    
    async with AsyncSessionLocal() as session:
        retrieved_chunks = await retrieve_relevant_chunks(query, session, top_k=3, similarity_threshold=0.35)
        context_text = "\n\n---\n\n".join([f"Title: {c['episode_title']}\nContent: {c['content']}" for c in retrieved_chunks])
        
        system_prompt = (
            "You are a Q&A assistant. Answer the user's question using ONLY the provided context.\n"
            "If the context is completely irrelevant to the user's question, say 'I'm sorry, but my knowledge base cannot support this answer.'\n"
            "Otherwise, extract any relevant insights from the context and provide the best answer you can."
        )
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://agent-service:3001/synthesize",
                json={
                    "systemPrompt": system_prompt,
                    "query": query,
                    "context": context_text
                }
            )
            data = response.json()
            print("Response:", data.get("answer"))

if __name__ == "__main__":
    asyncio.run(main())
