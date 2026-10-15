from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union
from pymongo.database import Database
from pydantic import BaseModel

class ToolContext(BaseModel):
    user_id: Union[str, int]
    agent_run_id: Union[str, int]
    step_order: int
    simulate_failure: bool = False
    idempotency_key: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

class ToolResult(BaseModel):
    success: bool
    data: Dict[str, Any] = {}
    summary: str
    error: Optional[str] = None
    retryable: bool = True

class VerificationResult(BaseModel):
    passed: bool
    evidence: Dict[str, Any] = {}
    details: str

class BaseTool(ABC):
    name: str
    description: str
    input_schema: Dict[str, Any]
    is_idempotent: bool = True
    is_safe_to_retry: bool = True

    @abstractmethod
    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        """Executes the tool action using MongoDB persistence."""
        pass

    @abstractmethod
    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        """Verifies the actual outcome independently against MongoDB database documents."""
        pass
