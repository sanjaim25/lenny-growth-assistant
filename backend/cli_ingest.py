import asyncio
import logging
import os
import sys

from app.database import AsyncSessionLocal
from app.rag.ingestion import ingest_transcripts

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

async def main():
    data_dir = os.path.join(os.path.dirname(__file__), "data", "transcripts")
    
    if not os.path.exists(data_dir):
        print(f"Data directory {data_dir} does not exist. Please clone the repository first.")
        sys.exit(1)
        
    async with AsyncSessionLocal() as session:
        try:
            await ingest_transcripts(data_dir, session)
        except Exception as e:
            print(f"Error during ingestion: {e}")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
