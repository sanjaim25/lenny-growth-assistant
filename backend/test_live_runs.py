import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Create a fresh chat session
        response = await client.post("/api/sessions", json={"title": "Test Session"})
        session_id = response.json()["id"]
        
        # Test 1, 2, 3: Enterprise deals question 3 times
        query = "What is the best way to close enterprise deals?"
        print(f"=== TEST RUNS FOR QUERY: '{query}' ===")
        for i in range(3):
            res = await client.post(f"/api/sessions/{session_id}/chat", json={"message": query}, timeout=60.0)
            data = res.json()
            content = data.get("content")
            citations = [s for s in data.get("sources", []) if s.get("type") == "citation"]
            passed = "win rate" in content.lower() or "art" in content.lower() or "jen abel" in content.lower() or "15 steps" in content.lower() or "understand" in content.lower()
            refusal = "knowledge base cannot support" in content.lower() or "unfortunately" in content.lower()
            
            print(f"Run {i+1}:")
            print(f"  Content: {content}")
            print(f"  Refused? {refusal}")
            print(f"  Citations: {[c['episode_title'] for c in citations]}")
            print(f"  Pass: {not refusal and passed and len(citations) > 0}\n")
            
        # Test 4: Follow up question
        followup = "Can you summarize that?"
        print(f"=== TEST FOLLOW-UP: '{followup}' ===")
        res = await client.post(f"/api/sessions/{session_id}/chat", json={"message": followup}, timeout=60.0)
        data = res.json()
        content = data.get("content")
        citations = [s for s in data.get("sources", []) if s.get("type") == "citation"]
        refusal = "knowledge base cannot support" in content.lower() or "unfortunately" in content.lower()
        print(f"  Content: {content[:100]}...")
        print(f"  Refused? {refusal}")
        print(f"  Citations: {[c['episode_title'] for c in citations]}")
        print(f"  Pass: {not refusal}\n")
        
        # Test 5: Unrelated question
        unrelated = "How to bake a chocolate cake with strawberries"
        print(f"=== TEST UNRELATED: '{unrelated}' ===")
        res = await client.post(f"/api/sessions/{session_id}/chat", json={"message": unrelated}, timeout=60.0)
        data = res.json()
        content = data.get("content")
        citations = [s for s in data.get("sources", []) if s.get("type") == "citation"]
        refusal = "knowledge base cannot support" in content.lower() or "unfortunately" in content.lower()
        print(f"  Content: {content[:100]}...")
        print(f"  Refused? {refusal}")
        print(f"  Citations: {[c['episode_title'] for c in citations]}")
        print(f"  Pass: {refusal and len(citations) == 0}\n")

if __name__ == "__main__":
    asyncio.run(main())
