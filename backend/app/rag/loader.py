import json
import os
from typing import List, Dict, Any

def load_transcripts(data_dir: str) -> List[Dict[str, Any]]:
    """
    Loads transcripts from the cloned repository.
    Extracts episode title, guest, source URL, and raw markdown content.
    """
    index_path = os.path.join(data_dir, "index.json")
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"Index file not found at {index_path}")
        
    with open(index_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
        
    podcasts = metadata.get("podcasts", [])
    documents = []
    
    for pod in podcasts:
        filename = pod.get("filename")
        if not filename:
            continue
            
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            raw_content = f.read()
            
        documents.append({
            "title": pod.get("title", ""),
            "guest": pod.get("guest", ""),
            "source_url": pod.get("post_url", ""),
            "raw_content": raw_content,
            "filename": filename
        })
        
    return documents
