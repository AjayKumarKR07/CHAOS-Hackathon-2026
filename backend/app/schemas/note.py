from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, Field

class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: Union[str, int]
    user_id: Union[str, int]
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
