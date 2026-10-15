from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, Field

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = "TODO"  # TODO, IN_PROGRESS, DONE
    priority: Optional[str] = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    due_at: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_at: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: Union[str, int]
    user_id: Union[str, int]
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
