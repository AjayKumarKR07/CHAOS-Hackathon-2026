from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.agent import (
    AgentRunCreate,
    AgentRunResponse,
    AgentStepResponse,
    AgentRunRetryRequest,
    AgentStats,
    VerificationEvidenceResponse,
    RecoveryAnalyticsResponse,
    FailedStepRecoveryDetail
)
from app.agent.executor import executor
from app.tools.registry import tool_registry
from app.db.serializers import build_id_query, serialize_agent_run, serialize_agent_step

router = APIRouter(prefix="/agent", tags=["Agent Engine"])

@router.post("/runs", response_model=AgentRunResponse, status_code=status.HTTP_201_CREATED)
def trigger_agent_run(
    run_in: AgentRunCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Submits a natural language task to the JARVIS Agent.
    Executes planning, tool verification in MongoDB Atlas, and returns transparent execution results.
    """
    run_result = executor.execute_new_run(
        db=db,
        user_id=current_user["id"],
        request_text=run_in.request,
        simulate_failure=run_in.simulate_failure,
        failure_step=run_in.failure_step
    )
    return AgentRunResponse.model_validate(run_result)

@router.get("/runs", response_model=List[AgentRunResponse])
def get_user_agent_runs(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_id_str = str(current_user["id"])
    cursor = db.agent_runs.find({"user_id": user_id_str}).sort("created_at", -1)
    
    runs = []
    for run_doc in cursor:
        run_id_str = str(run_doc["_id"])
        steps = list(db.agent_steps.find({"agent_run_id": run_id_str}).sort("step_order", 1))
        serialized = serialize_agent_run(run_doc, steps)
        runs.append(AgentRunResponse.model_validate(serialized))
    return runs

@router.get("/runs/{run_id}", response_model=AgentRunResponse)
def get_run_details(
    run_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_id_str = str(current_user["id"])
    query = {"$and": [build_id_query(run_id), {"user_id": user_id_str}]}
    run_doc = db.agent_runs.find_one(query)
    
    if not run_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent run not found")

    run_id_str = str(run_doc["_id"])
    steps = list(db.agent_steps.find({"agent_run_id": run_id_str}).sort("step_order", 1))
    return AgentRunResponse.model_validate(serialize_agent_run(run_doc, steps))

@router.get("/runs/{run_id}/steps/{step_id}/evidence", response_model=VerificationEvidenceResponse)
def get_step_verification_evidence(
    run_id: str,
    step_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Fetches transparent, sanitized verification evidence directly from MongoDB Atlas.
    Enforces user isolation and confirms independent database proof.
    """
    user_id_str = str(current_user["id"])
    run_query = {"$and": [build_id_query(run_id), {"user_id": user_id_str}]}
    run_doc = db.agent_runs.find_one(run_query)
    if not run_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent run not found or access denied."
        )

    run_id_str = str(run_doc["_id"])
    step_query = {"$and": [build_id_query(step_id), {"agent_run_id": run_id_str}]}
    step = db.agent_steps.find_one(step_query)
    if not step and step_id.isdigit():
        step = db.agent_steps.find_one({"agent_run_id": run_id_str, "step_order": int(step_id)})

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent step not found for this execution run."
        )

    # Calculate execution duration
    duration_ms = None
    if step.get("created_at") and step.get("completed_at"):
        try:
            duration_ms = round((step["completed_at"] - step["created_at"]).total_seconds() * 1000, 2)
        except Exception:
            duration_ms = None

    # Sanitize and extract record IDs
    evidence = step.get("verification_evidence") or {}
    sanitized_evidence = {}
    sensitive_keys = {"password", "secret", "token", "hash", "key"}
    for k, v in evidence.items():
        if not any(sk in k.lower() for sk in sensitive_keys):
            sanitized_evidence[k] = v

    record_ids = {}
    if "verified_task_id" in evidence:
        record_ids["task_id"] = str(evidence["verified_task_id"])
    if "verified_note_id" in evidence:
        record_ids["note_id"] = str(evidence["verified_note_id"])
    if step.get("result_data") and isinstance(step["result_data"], dict):
        for rk, rv in step["result_data"].items():
            if "id" in rk.lower() and not any(sk in rk.lower() for sk in sensitive_keys):
                record_ids[rk] = str(rv)

    # Build safe human-readable MongoDB query summary
    action = step.get("action_type", "")
    if "task" in action:
        target_id = record_ids.get("task_id", step.get("action_input", {}).get("task_id", "..."))
        query_summary = f'db.tasks.find_one({{"_id": "{target_id}", "user_id": "{user_id_str}"}})'
    elif "note" in action:
        target_id = record_ids.get("note_id", step.get("action_input", {}).get("note_id", "..."))
        query_summary = f'db.notes.find_one({{"_id": "{target_id}", "user_id": "{user_id_str}"}})'
    elif "summary" in action:
        query_summary = f'db.tasks.find({{"user_id": "{user_id_str}"}}) & db.notes.find({{"user_id": "{user_id_str}"}})'
    elif "notification" in action:
        query_summary = f'db.execution_logs.find_one({{"agent_run_id": "{run_id_str}", "user_id": "{user_id_str}"}})'
    else:
        query_summary = f'db.{action.split(".")[0]}s.find_one({{"user_id": "{user_id_str}"}})'

    evidence_available = bool(step.get("verification_status") == "PASSED" and sanitized_evidence)

    return VerificationEvidenceResponse(
        step_id=str(step["_id"]),
        run_id=run_id_str,
        step_order=step.get("step_order", 1),
        action_type=step.get("action_type", ""),
        tool_name=step.get("action_type", ""),
        status=step.get("status", "PENDING"),
        attempt_count=step.get("attempt_count", 0),
        max_attempts=step.get("max_attempts", 3),
        verification_status=step.get("verification_status", "UNVERIFIED"),
        verification_evidence=sanitized_evidence if sanitized_evidence else None,
        record_ids=record_ids,
        query_summary=query_summary,
        error_message=step.get("error_message"),
        result_summary=step.get("result_summary"),
        execution_duration_ms=duration_ms,
        evidence_available=evidence_available,
        storage_engine="MongoDB Atlas",
        created_at=step.get("created_at"),
        completed_at=step.get("completed_at")
    )

@router.post("/runs/{run_id}/steps/{step_id}/retry", response_model=AgentStepResponse)
def retry_failed_step(
    run_id: str,
    step_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    try:
        retried_step = executor.retry_step(
            db=db,
            user_id=current_user["id"],
            run_id=run_id,
            step_id=step_id
        )
        return AgentStepResponse.model_validate(retried_step)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Retry execution failed: {str(e)}")

@router.post("/runs/{run_id}/retry", response_model=AgentRunResponse)
def retry_entire_run(
    run_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_id_str = str(current_user["id"])
    query = {"$and": [build_id_query(run_id), {"user_id": user_id_str}]}
    run_doc = db.agent_runs.find_one(query)
    if not run_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent run not found")

    run_id_str = str(run_doc["_id"])
    steps = list(db.agent_steps.find({"agent_run_id": run_id_str, "status": "FAILED"}))

    for step in steps:
        executor.retry_step(db=db, user_id=current_user["id"], run_id=run_id_str, step_id=str(step["_id"]))

    updated_run = db.agent_runs.find_one({"_id": run_doc["_id"]})
    all_steps = list(db.agent_steps.find({"agent_run_id": run_id_str}).sort("step_order", 1))
    return AgentRunResponse.model_validate(serialize_agent_run(updated_run, all_steps))

@router.get("/stats", response_model=AgentStats)
def get_user_agent_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_id_str = str(current_user["id"])
    
    total_runs = db.agent_runs.count_documents({"user_id": user_id_str})
    successful_runs = db.agent_runs.count_documents({"user_id": user_id_str, "status": "SUCCEEDED"})
    failed_runs = db.agent_runs.count_documents({"user_id": user_id_str, "status": "FAILED"})
    
    total_steps = db.agent_steps.count_documents({"agent_run_id": {"$in": [
        str(r["_id"]) for r in db.agent_runs.find({"user_id": user_id_str}, {"_id": 1})
    ]}})
    
    total_tasks = db.tasks.count_documents({"user_id": user_id_str})
    total_notes = db.notes.count_documents({"user_id": user_id_str})
    
    success_rate = round((successful_runs / total_runs * 100), 1) if total_runs > 0 else 100.0

    return AgentStats(
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        total_steps_executed=total_steps,
        total_tasks=total_tasks,
        total_notes=total_notes,
        success_rate=success_rate
    )

@router.get("/analytics/recovery", response_model=RecoveryAnalyticsResponse)
def get_recovery_analytics(
    date_range: str = "all",
    status_filter: str = "ALL",
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Computes Smart Failure Recovery Analytics from actual MongoDB Atlas execution records.
    Features: total runs, failed steps, retry attempts, recovered failures, unresolved failures,
    recovery success rate (safe division), average duration, and filter support.
    """
    from datetime import datetime, timezone, timedelta
    user_id_str = str(current_user["id"])
    run_query: Dict[str, Any] = {"user_id": user_id_str}

    now = datetime.now(timezone.utc)
    if date_range == "today":
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        run_query["created_at"] = {"$gte": start_of_day}
    elif date_range == "7d":
        run_query["created_at"] = {"$gte": now - timedelta(days=7)}
    elif date_range == "30d":
        run_query["created_at"] = {"$gte": now - timedelta(days=30)}

    if status_filter and status_filter.upper() != "ALL":
        run_query["status"] = status_filter.upper()

    user_runs = list(db.agent_runs.find(run_query).sort("created_at", -1))
    run_ids = [str(r["_id"]) for r in user_runs]
    run_status_map = {str(r["_id"]): r.get("status", "UNKNOWN") for r in user_runs}

    # Fetch corresponding steps from MongoDB Atlas
    steps = list(db.agent_steps.find({"agent_run_id": {"$in": run_ids}}).sort("created_at", -1)) if run_ids else []

    total_runs = len(user_runs)
    total_steps = len(steps)

    failed_steps = 0
    retry_attempts = 0
    recovered_failures = 0
    unresolved_failures = 0
    failed_steps_detail: List[FailedStepRecoveryDetail] = []

    for s in steps:
        step_status = s.get("status", "PENDING")
        attempts = s.get("attempt_count", 0)
        max_attempts = s.get("max_attempts", 3)
        run_id = str(s.get("agent_run_id"))

        if attempts > 1:
            retry_attempts += (attempts - 1)

        is_recovered = bool(s.get("recovered") is True or s.get("recovery_count", 0) > 0 or (attempts > 1 and step_status == "SUCCEEDED"))
        encountered_failure = (step_status == "FAILED" or is_recovered or attempts > 1 or s.get("error_message") is not None)
        if encountered_failure:
            failed_steps += 1
            if step_status == "SUCCEEDED" or is_recovered:
                recovered_failures += 1
                rec_status = "RECOVERED"
            elif step_status == "FAILED":
                unresolved_failures += 1
                rec_status = "UNRESOLVED"
            else:
                rec_status = "RETRY_SCHEDULED"

            tool = tool_registry.get_tool(s.get("action_type", ""))
            is_safe = tool.is_safe_to_retry if tool else True

            failed_steps_detail.append(FailedStepRecoveryDetail(
                step_id=str(s["_id"]),
                run_id=run_id,
                step_order=s.get("step_order", 1),
                action_type=s.get("action_type", ""),
                error_message=s.get("error_message"),
                attempt_count=attempts,
                max_attempts=max_attempts,
                is_safe_to_retry=is_safe,
                recovery_status=rec_status,
                run_status=run_status_map.get(run_id, "UNKNOWN"),
                created_at=s.get("created_at", now),
                completed_at=s.get("completed_at")
            ))

    total_failures = recovered_failures + unresolved_failures
    recovery_success_rate = round((recovered_failures / total_failures * 100), 1) if total_failures > 0 else 100.0

    # Calculate average execution duration for completed runs
    durations = []
    for r in user_runs:
        if r.get("created_at") and r.get("completed_at"):
            try:
                dur = (r["completed_at"] - r["created_at"]).total_seconds()
                if dur >= 0:
                    durations.append(dur)
            except Exception:
                pass

    avg_duration = round(sum(durations) / len(durations), 2) if durations else 0.0

    return RecoveryAnalyticsResponse(
        total_runs=total_runs,
        total_steps=total_steps,
        failed_steps=failed_steps,
        retry_attempts=retry_attempts,
        recovered_failures=recovered_failures,
        unresolved_failures=unresolved_failures,
        recovery_success_rate=recovery_success_rate,
        recovery_rate_definition="Percentage of encountered failures successfully recovered and verified: (Recovered / (Recovered + Unresolved) * 100)",
        avg_execution_duration_sec=avg_duration,
        failed_steps_detail=failed_steps_detail,
        filter_date_range=date_range,
        filter_status=status_filter.upper()
    )
