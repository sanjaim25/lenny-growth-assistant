import asyncio
import httpx
import json

async def main():
    async with httpx.AsyncClient() as client:
        # Create session
        res = await client.post("http://localhost:8000/api/sessions", json={"title": "Test"})
        session_id = res.json()["id"]
        
        # Request essay
        print("Generating essay...")
        res = await client.post(f"http://localhost:8000/api/sessions/{session_id}/essay", json={"topic": "How to do enterprise sales", "angle": "A beginner's guide"}, timeout=120)
        data = res.json()
        print("Title:", data.get("title"))
        print("Word Count:", data.get("word_count"))
        print("Sources:", json.dumps(data.get("sources"), indent=2))
        print("Content:")
        print(data.get("content"))

if __name__ == "__main__":
    asyncio.run(main())
