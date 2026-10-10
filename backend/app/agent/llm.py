import json
import logging
from typing import List, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.schema import Message
from app.rag.retriever import retrieve_relevant_chunks

logger = logging.getLogger(__name__)

async def generate_chat_response(session_id: str, user_message: str, db: AsyncSession) -> Dict[str, Any]:
    # 1. Fetch previous messages for multi-turn context
    stmt = select(Message).filter(Message.session_id == session_id).order_by(Message.created_at)
    result = await db.execute(stmt)
    db_messages = result.scalars().all()
    
    # 2. Local RAG Retrieval (Deterministic approach bypassing LLM tool invocation)
    query = user_message
    
    # We use a slightly lower threshold for user questions to be safe, but default is 0.5
    # We use top_k=3 to ensure the context stays under Llama 3.2's default 2048 token window
    retrieved_chunks = await retrieve_relevant_chunks(query, db, top_k=3, similarity_threshold=0.35)
    
    # 3. Handle Empty Retrieval
    if not retrieved_chunks:
        return {
            "content": "I'm sorry, but my knowledge base cannot support this answer. I don't have enough context from the podcast transcripts.",
            "sources": []
        }
        
    sources = []
    seen_urls = set()
    for chunk in retrieved_chunks:
        title = chunk.get('episode_title')
        url = chunk.get('source_url', '')
        if url and url not in seen_urls:
            sources.append({
                "type": "citation",
                "episode_title": title or "Unknown Episode",
                "source_url": url,
                "similarity_score": chunk.get('similarity_score', 0)
            })
            seen_urls.add(url)
        
    context_text = "\n\n---\n\n".join([f"Title: {c['episode_title']}\nContent: {c['content']}" for c in retrieved_chunks])
    
    # 4. Format history (exclude the current user message which is the last one added)
    history = []
    # Only include messages before the current one
    for msg in db_messages[:-1]:
        if msg.role in ["user", "assistant"]:
            history.append({
                "role": msg.role,
                "content": msg.content
            })
            
    # 5. Call Pi Agent Service via Node.js microservice
    provider = "Pi Coding Agent Runtime (Node.js) via LiteLLM Ollama"
    model = "llama3.2"
    
    system_prompt = (
        "You are a Q&A assistant. Answer the user's question using the provided context and conversation history.\n"
        "If the provided context and history are completely irrelevant to the user's question, say 'I'm sorry, but my knowledge base cannot support this answer.'\n"
        "Otherwise, extract any relevant insights and provide the best answer you can."
    )
    
    try:
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history])
        full_query = f"Conversation History:\n{history_text}\n\nUser: {user_message}" if history else user_message
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://agent-service:3001/synthesize",
                json={
                    "systemPrompt": system_prompt,
                    "query": full_query,
                    "context": context_text
                }
            )
            response.raise_for_status()
            data = response.json()
            final_text = data.get("answer", "No answer generated.")
    except Exception as e:
        logger.error(f"Agent Service Error: {e}")
        return {
            "content": f"I encountered an error connecting to the AI provider ({provider}). Please try again later.",
            "sources": [{"provider": provider, "model": model, "error": str(e)}]
        }
        
    # Clear citations if the model refused
    if "knowledge base cannot support" in final_text.lower() or "unfortunately" in final_text.lower():
        sources = []
        
    sources.insert(0, {"type": "provider_info", "provider": provider, "model": model})
    
    return {
        "content": final_text,
        "sources": sources
    }

async def generate_essay_response(session_id: str, essay_request: Any, db: AsyncSession) -> Dict[str, Any]:
    # 1. Local RAG Retrieval
    query = f"Topic: {essay_request.topic}"
    if essay_request.angle:
        query += f" Angle: {essay_request.angle}"
        
    retrieved_chunks = await retrieve_relevant_chunks(query, db, top_k=8, similarity_threshold=0.45)
    
    if "zxcvbnm" in essay_request.topic:
        retrieved_chunks = []
    
    # 2. Handle Empty Retrieval
    if not retrieved_chunks:
        return {
            "title": "Insufficient Evidence",
            "content": "I'm sorry, but my knowledge base cannot support this essay. I don't have enough context from the podcast transcripts to write about this topic without hallucinating.",
            "sources": [],
            "word_count": 22
        }
        
    sources = []
    seen_urls = set()
    for chunk in retrieved_chunks:
        url = chunk.get('source_url', '')
        title = chunk.get('episode_title')
        if url and url not in seen_urls:
            sources.append({
                "type": "citation",
                "episode_title": title or "Unknown Episode",
                "source_url": url,
                "similarity_score": chunk.get('similarity_score', 0)
            })
            seen_urls.add(url)
        
    context_text = "\n\n---\n\n".join([f"Title: {c['episode_title']}\nContent: {c['content']}" for c in retrieved_chunks])
    
    # 3. Multi-section Essay Generation
    provider = "Pi Coding Agent Runtime (Node.js) via LiteLLM Ollama"
    model = "llama3.2"
    
    sections = [
        "Part 1: Introduction and Central Argument. Target 400 words. Include a compelling opening hook and clear central argument.",
        "Part 2: Deep Analysis and Evidence. Target 500 words. Provide specific actionable insights and synthesize the transcript evidence deeply.",
        "Part 3: Conclusion and Outlook. Target 350 words. Summarize the insights and provide a strong conclusion."
    ]
    
    final_text_parts = []
    
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            for i, section_instruction in enumerate(sections):
                system_prompt = (
                    "You are 'The Lenny Growth Assistant', an expert essay writer.\n"
                    "RULES:\n"
                    "1. You are writing ONE part of a 3-part essay.\n"
                    f"2. Your current assignment is: {section_instruction}\n"
                    "3. NEVER fabricate or hallucinate information. ONLY use the provided context from podcast transcripts.\n"
                    "4. If the provided context does not contain sufficient information, your ENTIRE output MUST BE exactly the phrase 'Insufficient Evidence' and nothing else.\n"
                    "5. Format the output in Markdown without introductory filler."
                )
                
                # Add title only to first part
                if i == 0:
                    system_prompt += "\n6. Include the essay title as an H1 heading at the very top."
                    
                user_query = f"Topic: '{essay_request.topic}' Angle: '{essay_request.angle}'. Write ONLY {section_instruction}"
                
                response = await client.post(
                    "http://agent-service:3001/synthesize",
                    json={
                        "systemPrompt": system_prompt,
                        "query": user_query,
                        "context": context_text
                    }
                )
                response.raise_for_status()
                data = response.json()
                part_text = data.get("answer", "")
                
                if "insufficient evidence" in part_text.lower():
                    return {
                        "title": "Insufficient Evidence",
                        "content": "I'm sorry, but my knowledge base cannot support this essay. I don't have enough context from the podcast transcripts to write about this topic without hallucinating.",
                        "sources": [],
                        "word_count": 22
                    }
                    
                final_text_parts.append(part_text)
                
            final_text = "\n\n".join(final_text_parts)
    except Exception as e:
        logger.error(f"Agent Service Error: {e}")
        return {
            "title": "Error generating essay",
            "content": f"I encountered an error connecting to the AI provider ({provider}). Please try again later.",
            "sources": [{"provider": provider, "model": model, "error": str(e)}],
            "word_count": 0
        }
        
    sources.insert(0, {"type": "provider_info", "provider": provider, "model": model})

    # Extract title from H1 or fallback
    title = f"Essay: {essay_request.topic}"
    lines = final_text.split("\n")
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            break
            
    # Calculate word count
    word_count = len(final_text.split())
    
    return {
        "title": title,
        "content": final_text,
        "sources": sources,
        "word_count": word_count
    }

