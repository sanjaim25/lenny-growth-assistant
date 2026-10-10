import asyncio
import os
from claude_agent_sdk import query

async def main():
    print("Testing Claude Agent SDK...")
    
    # query() yields stream events
    try:
        async for msg in query(prompt="What is 2+2?"):
            print(msg)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
