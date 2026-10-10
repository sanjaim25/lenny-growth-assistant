import httpx
import logging
from app.config import settings
from tenacity import retry, wait_exponential, stop_after_attempt

logger = logging.getLogger(__name__)

# Verify embeddings return 768 dimensions
EXPECTED_DIMENSIONS = 768

@retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(5))
async def get_embedding(text: str, model: str = "nomic-embed-text") -> list[float]:
    """Get embeddings from Ollama for the given text."""
    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            json={
                "model": model,
                "prompt": text
            },
            timeout=30.0
        )
        response.raise_for_status()
        data = response.json()
        
        embedding = data.get("embedding", [])
        
        if len(embedding) != EXPECTED_DIMENSIONS:
            raise ValueError(f"Expected embedding dimension {EXPECTED_DIMENSIONS}, got {len(embedding)}")
            
        return embedding
