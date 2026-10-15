from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class AgentRunCreate(BaseModel):
    request: str = Field(..., min_length=2, max_length=1000)
    simulate_failure: bool = False
    failure_step: Optional[int] = None  # e.g., 2 to intentionally fail step 2

class AgentStepResponse(BaseModel):
    id: Union[str, int]
    agent_run_id: Union[str, int]
    step_order: int
    action_type: str
    action_input: Dict[str, Any]
    status: str
    attempt_count: int
    max_attempts: int
    result_summary: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    verification_status: str
    verification_evidence: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AgentRunResponse(BaseModel):
    id: Union[str, int]
    user_id: Union[str, int]
    original_request: str
    status: str
    test_mode: bool
    failure_injected: bool
    execution_summary: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    steps: List[AgentStepResponse] = []

    class Config:
        from_attributes = True

class AgentRunRetryRequest(BaseModel):
    step_id: Optional[Union[str, int]] = None

class AgentStats(BaseModel):
    total_runs: int
    successful_runs: int
    failed_runs: int
    total_steps_executed: int
    total_tasks: int
    total_notes: int
    success_rate: float

class VerificationEvidenceResponse(BaseModel):
    step_id: str
    run_id: str
    step_order: int
    action_type: str
    tool_name: str
    status: str
    attempt_count: int
    max_attempts: int
    verification_status: str
    verification_evidence: Optional[Dict[str, Any]] = None
    record_ids: Dict[str, Any] = {}
    query_summary: str
    error_message: Optional[str] = None
    result_summary: Optional[str] = None
    execution_duration_ms: Optional[float] = None
    evidence_available: bool = True
    storage_engine: str = "MongoDB Atlas"
    created_at: datetime
    completed_at: Optional[datetime] = None

class FailedStepRecoveryDetail(BaseModel):
    step_id: str
    run_id: str
    step_order: int
    action_type: str
    error_message: Optional[str] = None
    attempt_count: int
    max_attempts: int
    is_safe_to_retry: bool = True
    recovery_status: str  # RECOVERED | UNRESOLVED | RETRY_SCHEDULED
    run_status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

class RecoveryAnalyticsResponse(BaseModel):
    total_runs: int
    total_steps: int
    failed_steps: int
    retry_attempts: int
    recovered_failures: int
    unresolved_failures: int
    recovery_success_rate: float
    recovery_rate_definition: str
    avg_execution_duration_sec: float
    failed_steps_detail: List[FailedStepRecoveryDetail] = []
    filter_date_range: str = "all"
    filter_status: str = "ALL"
