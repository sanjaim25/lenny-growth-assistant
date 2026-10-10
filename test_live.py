import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Create session
        res = await client.post("/api/sessions", json={"title": "Test RAG"})
        session_id = res.json()["id"]
        print(f"Session created: {session_id}")

        # 1. RAG query
        print("\n--- Question 1: Enterprise Deals ---")
        q1 = {"message": "What is the best way to close enterprise deals?"}
        res1 = await client.post(f"/api/sessions/{session_id}/chat", json=q1, timeout=60.0)
        data1 = res1.json()
        print(f"Content: {data1['content']}")
        print(f"Sources: {data1.get('sources', [])}")

        # 2. Unrelated question
        print("\n--- Question 2: Chocolate Cake ---")
        q2 = {"message": "How to bake a chocolate cake with strawberries"}
        res2 = await client.post(f"/api/sessions/{session_id}/chat", json=q2, timeout=60.0)
        data2 = res2.json()
        print(f"Content: {data2['content']}")
        print(f"Sources: {data2.get('sources', [])}")

        # 3. Follow-up
        print("\n--- Question 3: Follow-up ---")
        q3 = {"message": "Can you summarize what she said in one sentence?"}
        res3 = await client.post(f"/api/sessions/{session_id}/chat", json=q3, timeout=60.0)
        data3 = res3.json()
        print(f"Content: {data3['content']}")
        print(f"Sources: {data3.get('sources', [])}")

if __name__ == "__main__":
    asyncio.run(main())
