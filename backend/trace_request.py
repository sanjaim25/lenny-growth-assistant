import asyncio
import httpx
from app.database import AsyncSessionLocal
from app.rag.retriever import retrieve_relevant_chunks

async def main():
    query = "What is the best way to close enterprise deals?"
    print(f"Query: {query}")
    
    async with AsyncSessionLocal() as session:
        retrieved_chunks = await retrieve_relevant_chunks(query, session, top_k=5, similarity_threshold=0.35)
        
        print("\n--- RETRIEVED CHUNKS ---")
        for c in retrieved_chunks:
            print(f"[{c['similarity_score']:.4f}] {c['episode_title']}")
            print(f"Content excerpt: {c['content'][:100]}...\n")
            
        context_text = "\n\n---\n\n".join([f"Title: {c['episode_title']}\nContent: {c['content']}" for c in retrieved_chunks])
        
        print("\n--- CONTEXT SENT TO AGENT ---")
        print(f"Total Context Length: {len(context_text)} characters")
        
        system_prompt = (
            "You are 'The Lenny Growth Assistant', a highly capable AI assistant that answers questions based "
            "on podcast transcripts.\n"
            "RULES:\n"
            "1. Never fabricate or hallucinate information. Only use the retrieved context provided.\n"
            "2. If the context is entirely unrelated or insufficient to answer the question, explicitly state: "
            "'I'm sorry, but my knowledge base cannot support this answer.' and stop. Do not append any speculative facts.\n"
            "3. If the context contains ANY relevant insights or metrics, provide them directly and coherently without using the refusal string.\n"
            "4. Be concise, direct, and professional."
        )
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "http://agent-service:3001/synthesize",
                    json={
                        "systemPrompt": system_prompt,
                        "query": query,
                        "context": context_text
                    }
                )
                response.raise_for_status()
                data = response.json()
                final_text = data.get("answer", "No answer generated.")
                print("\n--- RESPONSE FROM AGENT ---")
                print(final_text)
                
                print("\n--- LAST MESSAGE ---")
                print(data.get("lastMessage", {}))
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
