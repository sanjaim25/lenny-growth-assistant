import tiktoken
from typing import List, Dict, Any

def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """
    Split text into chunks of roughly `chunk_size` tokens with `chunk_overlap` overlap.
    Uses cl100k_base (OpenAI) which is a good proxy for most modern LLM tokenizers.
    """
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
    except Exception:
        # Fallback if tiktoken fails
        encoding = tiktoken.get_encoding("gpt2")
        
    tokens = encoding.encode(text)
    chunks = []
    
    if not tokens:
        return []
        
    i = 0
    while i < len(tokens):
        # Take a slice of tokens
        end_idx = min(i + chunk_size, len(tokens))
        chunk_tokens = tokens[i:end_idx]
        
        # Decode back to text
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        
        # Break if we've reached the end
        if end_idx == len(tokens):
            break
            
        # Move forward by chunk_size - chunk_overlap
        i += (chunk_size - chunk_overlap)
        
    return chunks
