from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class MessageBase(BaseModel):
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: UUID
    session_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SessionBase(BaseModel):
    title: str = "New Chat"

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class SessionResponse(SessionBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SessionDetailResponse(SessionResponse):
    messages: List[MessageResponse] = []
    artifacts: List['ArtifactResponse'] = []

class ChatRequest(BaseModel):
    message: str

class EssayRequest(BaseModel):
    topic: str
    angle: Optional[str] = None

class ArtifactResponse(BaseModel):
    id: UUID
    session_id: UUID
    artifact_type: str
    title: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    word_count: Optional[int] = None
    content: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
