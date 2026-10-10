from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List

from app.database import get_db
from app.models.pydantic_schemas import (
    SessionResponse, SessionCreate, SessionDetailResponse, ChatRequest, MessageResponse,
    EssayRequest, ArtifactResponse
)
from app.agent.llm import generate_chat_response, generate_essay_response, generate_html_response
from app.models.schema import Session, Message, Artifact

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("", response_model=SessionResponse)
async def create_session(session_in: SessionCreate, db: AsyncSession = Depends(get_db)):
    db_session = Session(title=session_in.title)
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

@router.get("", response_model=List[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    # Order by most recent activity (latest message or session creation)
    stmt = (
        select(Session)
        .outerjoin(Message)
        .group_by(Session.id)
        .order_by(desc(func.coalesce(func.max(Message.created_at), Session.created_at)))
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return sessions

@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages), selectinload(Session.artifacts))
        .filter(Session.id == session_id)
    )
    db_session = result.scalar_one_or_none()
    
    if db_session:
        db_session.messages.sort(key=lambda m: m.created_at)
        db_session.artifacts.sort(key=lambda a: a.created_at)
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return db_session

@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).filter(Session.id == session_id))
    db_session = result.scalar_one_or_none()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await db.delete(db_session)
    await db.commit()
    return None

@router.post("/{session_id}/chat", response_model=MessageResponse)
async def chat(session_id: UUID, chat_request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    result = await db.execute(select(Session).filter(Session.id == session_id))
    db_session = result.scalar_one_or_none()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save user message
    user_message = Message(
        session_id=session_id,
        role="user",
        content=chat_request.message
    )
    db.add(user_message)
    
    # Generate AI response via agent layer
    ai_result = await generate_chat_response(session_id, chat_request.message, db)
    
    assistant_message = Message(
        session_id=session_id,
        role="assistant",
        content=ai_result["content"],
        sources=ai_result["sources"]
    )
    db.add(assistant_message)
    
    await db.commit()
    await db.refresh(assistant_message)
    
    return assistant_message

@router.post("/{session_id}/essay", response_model=ArtifactResponse)
async def generate_essay(session_id: UUID, essay_request: EssayRequest, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    result = await db.execute(select(Session).filter(Session.id == session_id))
    db_session = result.scalar_one_or_none()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save user message about starting an essay
    user_message = Message(
        session_id=session_id,
        role="user",
        content=f"Write an essay about: {essay_request.topic}" + (f" with angle: {essay_request.angle}" if essay_request.angle else "")
    )
    db.add(user_message)
    
    # Generate essay via agent layer
    ai_result = await generate_essay_response(session_id, essay_request, db)
    
    assistant_message = Message(
        session_id=session_id,
        role="assistant",
        content=f"I have generated the essay: '{ai_result['title']}'.",
        sources=ai_result["sources"]
    )
    db.add(assistant_message)
    
    # Save the artifact
    artifact = Artifact(
        session_id=session_id,
        artifact_type="markdown",
        title=ai_result["title"],
        sources=ai_result["sources"],
        word_count=ai_result["word_count"],
        content=ai_result["content"]
    )
    db.add(artifact)
    
    await db.commit()
    await db.refresh(artifact)
    
    return artifact

@router.post("/{session_id}/html", response_model=ArtifactResponse)
async def generate_html(session_id: UUID, chat_request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    result = await db.execute(select(Session).filter(Session.id == session_id))
    db_session = result.scalar_one_or_none()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save user message about generating HTML
    user_message = Message(
        session_id=session_id,
        role="user",
        content=chat_request.message
    )
    db.add(user_message)
    
    # Generate HTML via agent layer
    ai_result = await generate_html_response(str(session_id), chat_request.message, db)
    
    assistant_message = Message(
        session_id=session_id,
        role="assistant",
        content=f"I have generated the requested HTML artifact.",
        sources=ai_result["sources"]
    )
    db.add(assistant_message)
    
    # Save the artifact
    artifact = Artifact(
        session_id=session_id,
        artifact_type="html",
        title=ai_result["title"],
        sources=ai_result["sources"],
        word_count=ai_result["word_count"],
        content=ai_result["content"]
    )
    db.add(artifact)
    
    await db.commit()
    await db.refresh(artifact)
    
    return artifact
