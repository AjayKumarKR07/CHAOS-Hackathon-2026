from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
from bson import ObjectId

def parse_id(id_val: Any) -> Any:
    """Converts string to ObjectId if valid 24-character hex, otherwise returns string."""
    if isinstance(id_val, ObjectId):
        return id_val
    if isinstance(id_val, str) and len(id_val) == 24 and all(c in "0123456789abcdefABCDEF" for c in id_val):
        try:
            return ObjectId(id_val)
        except Exception:
            return id_val
    return id_val

def build_id_query(id_val: Any) -> Dict[str, Any]:
    """Builds a robust MongoDB query matching either _id as ObjectId or _id as string or int."""
    parsed = parse_id(id_val)
    if isinstance(parsed, ObjectId):
        return {"$or": [{"_id": parsed}, {"_id": str(id_val)}, {"id": str(id_val)}]}
    return {"$or": [{"_id": id_val}, {"_id": str(id_val)}, {"id": str(id_val)}]}

def serialize_user(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    user_id = str(doc.get("_id", doc.get("id", "")))
    return {
        "id": user_id,
        "full_name": doc.get("full_name", ""),
        "email": doc.get("email", ""),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc),
    }

def serialize_task(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    task_id = str(doc.get("_id", doc.get("id", "")))
    return {
        "id": task_id,
        "user_id": str(doc.get("user_id", "")),
        "title": doc.get("title", ""),
        "description": doc.get("description"),
        "status": doc.get("status", "TODO"),
        "priority": doc.get("priority", "MEDIUM"),
        "due_at": doc.get("due_at"),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc),
        "updated_at": doc.get("updated_at") or datetime.now(timezone.utc),
    }

def serialize_note(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    note_id = str(doc.get("_id", doc.get("id", "")))
    return {
        "id": note_id,
        "user_id": str(doc.get("user_id", "")),
        "title": doc.get("title", ""),
        "content": doc.get("content", ""),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc),
        "updated_at": doc.get("updated_at") or datetime.now(timezone.utc),
    }

def serialize_agent_step(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    step_id = str(doc.get("_id", doc.get("id", "")))
    return {
        "id": step_id,
        "agent_run_id": str(doc.get("agent_run_id", "")),
        "step_order": doc.get("step_order", 1),
        "action_type": doc.get("action_type", ""),
        "action_input": doc.get("action_input", {}),
        "status": doc.get("status", "PENDING"),
        "attempt_count": doc.get("attempt_count", 0),
        "max_attempts": doc.get("max_attempts", 3),
        "result_summary": doc.get("result_summary"),
        "result_data": doc.get("result_data"),
        "error_message": doc.get("error_message"),
        "verification_status": doc.get("verification_status", "UNVERIFIED"),
        "verification_evidence": doc.get("verification_evidence"),
        "idempotency_key": doc.get("idempotency_key"),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc),
        "completed_at": doc.get("completed_at"),
    }

def serialize_agent_run(doc: Optional[Dict[str, Any]], steps: Optional[List[Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    run_id = str(doc.get("_id", doc.get("id", "")))
    serialized_steps = [serialize_agent_step(s) for s in (steps or doc.get("steps", []))]
    return {
        "id": run_id,
        "user_id": str(doc.get("user_id", "")),
        "original_request": doc.get("original_request", ""),
        "status": doc.get("status", "PENDING"),
        "test_mode": bool(doc.get("test_mode", False)),
        "failure_injected": bool(doc.get("failure_injected", False)),
        "execution_summary": doc.get("execution_summary"),
        "created_at": doc.get("created_at") or datetime.now(timezone.utc),
        "completed_at": doc.get("completed_at"),
        "steps": serialized_steps,
    }
