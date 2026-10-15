import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from pymongo.database import Database
from app.tools.registry import tool_registry
from app.tools.base import ToolContext
from app.agent.planner import planner
from app.agent.verifier import verifier
from app.agent.recovery import recovery_engine
from app.db.serializers import build_id_query, serialize_agent_run, serialize_agent_step

logger = logging.getLogger("jarvis.executor")

class AgentExecutor:
    def execute_new_run(
        self,
        db: Database,
        user_id: Union[str, int],
        request_text: str,
        simulate_failure: bool = False,
        failure_step: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes the full 10-stage lifecycle for a new user request using MongoDB Atlas persistence.
        """
        now = datetime.now(timezone.utc)
        user_id_str = str(user_id)

        # Stage 1: Create initial agent_run document in MongoDB
        run_doc = {
            "user_id": user_id_str,
            "original_request": request_text,
            "status": "RUNNING",
            "test_mode": simulate_failure,
            "failure_injected": simulate_failure,
            "execution_summary": None,
            "created_at": now,
            "completed_at": None
        }
        run_res = db.agent_runs.insert_one(run_doc)
        run_id_str = str(run_res.inserted_id)
        run_doc["_id"] = run_res.inserted_id

        # Stage 2 & 3: Generate plan and validate against allowlist
        planned_steps = planner.generate_plan(request_text)
        if not planned_steps:
            db.agent_runs.update_one(
                {"_id": run_res.inserted_id},
                {"$set": {
                    "status": "FAILED",
                    "execution_summary": "Planner could not generate any permitted actions for this request.",
                    "completed_at": datetime.now(timezone.utc)
                }}
            )
            updated_run = db.agent_runs.find_one({"_id": run_res.inserted_id})
            return serialize_agent_run(updated_run, [])

        # Persist initial step records in PENDING state in MongoDB
        db_steps: List[Dict[str, Any]] = []
        for step_data in planned_steps:
            idempotency_key = recovery_engine.generate_idempotency_key(
                user_id=user_id_str,
                run_id=run_id_str,
                step_order=step_data["step_order"],
                action_type=step_data["action_type"],
                action_input=step_data["action_input"]
            )
            step_doc = {
                "agent_run_id": run_id_str,
                "step_order": step_data["step_order"],
                "action_type": step_data["action_type"],
                "action_input": step_data["action_input"],
                "status": "PENDING",
                "attempt_count": 0,
                "max_attempts": 3,
                "result_summary": None,
                "result_data": None,
                "error_message": None,
                "verification_status": "UNVERIFIED",
                "verification_evidence": None,
                "idempotency_key": idempotency_key,
                "created_at": datetime.now(timezone.utc),
                "completed_at": None
            }
            s_res = db.agent_steps.insert_one(step_doc)
            step_doc["_id"] = s_res.inserted_id
            db_steps.append(step_doc)

        # Stages 4 through 9: Execute, Verify, Recover, Stop or Continue
        run_has_failure = False
        completed_count = 0
        failed_step_order = None
        failed_step_action = None

        for step in db_steps:
            inject_error = simulate_failure and (failure_step is None or failure_step == step["step_order"])

            step_success = self._execute_and_verify_step(
                db=db,
                user_id=user_id_str,
                run_id=run_id_str,
                step=step,
                inject_error=inject_error
            )

            if step_success:
                completed_count += 1
            else:
                run_has_failure = True
                failed_step_order = step["step_order"]
                failed_step_action = step["action_type"]
                logger.warning(f"Halting remaining steps in Run #{run_id_str} due to step #{step['step_order']} failure.")
                break

        total_steps = len(db_steps)
        now_completed = datetime.now(timezone.utc)

        # Mark all subsequent planned steps that were not executed as SKIPPED
        if run_has_failure and failed_step_order is not None:
            for s in db_steps:
                if s["step_order"] > failed_step_order:
                    db.agent_steps.update_one(
                        {"_id": s["_id"]},
                        {"$set": {
                            "status": "SKIPPED",
                            "error_message": f"Execution halted: Skipped because preceding Step #{failed_step_order} ({failed_step_action}) failed.",
                            "completed_at": now_completed
                        }}
                    )

        # Stage 10: Compile final transparent report
        if not run_has_failure and completed_count == total_steps:
            final_status = "SUCCEEDED"
            summary = f"All {total_steps} step(s) completed and independently verified in MongoDB Atlas."
        else:
            skipped_count = max(0, total_steps - completed_count - 1)
            final_status = "PARTIAL" if completed_count > 0 else "FAILED"
            summary = (
                f"Completed: {completed_count}/{total_steps} step(s). "
                f"Failed: Step #{failed_step_order} ({failed_step_action}). "
                f"Skipped: {skipped_count} dependent action(s)."
            )

        db.agent_runs.update_one(
            {"_id": run_res.inserted_id},
            {"$set": {
                "status": final_status,
                "execution_summary": summary,
                "completed_at": now_completed
            }}
        )

        final_run_doc = db.agent_runs.find_one({"_id": run_res.inserted_id})
        updated_steps = list(db.agent_steps.find({"agent_run_id": run_id_str}).sort("step_order", 1))
        return serialize_agent_run(final_run_doc, updated_steps)

    def _execute_and_verify_step(
        self,
        db: Database,
        user_id: str,
        run_id: str,
        step: Dict[str, Any],
        inject_error: bool = False
    ) -> bool:
        """
        Executes a single step, performs independent MongoDB verification, and handles retries with backoff.
        """
        step_id = step["_id"]
        action_type = step["action_type"]
        tool = tool_registry.get_tool(action_type)

        if not tool:
            db.agent_steps.update_one(
                {"_id": step_id},
                {"$set": {
                    "status": "FAILED",
                    "error_message": f"Security Violation: Tool '{action_type}' is not in the system allowlist.",
                    "completed_at": datetime.now(timezone.utc)
                }}
            )
            return False

        attempt_count = step.get("attempt_count", 0)
        max_attempts = step.get("max_attempts", 3)

        while attempt_count < max_attempts:
            attempt_count += 1
            db.agent_steps.update_one(
                {"_id": step_id},
                {"$set": {"status": "RUNNING", "attempt_count": attempt_count}}
            )

            context = ToolContext(
                user_id=user_id,
                agent_run_id=run_id,
                step_order=step["step_order"],
                simulate_failure=inject_error
            )

            tool_result = tool.execute(step["action_input"], context, db)

            # Persist execution result
            step_updates: Dict[str, Any] = {
                "result_summary": tool_result.summary,
                "result_data": tool_result.data
            }

            if not tool_result.success:
                step_updates["error_message"] = tool_result.error
                step_updates["verification_status"] = "FAILED"

                eligible, reason = recovery_engine.is_retry_eligible(
                    tool=tool,
                    attempt_count=attempt_count,
                    max_attempts=max_attempts,
                    error_message=tool_result.error or ""
                )

                if eligible and not inject_error:
                    step_updates["status"] = "RETRY_SCHEDULED"
                    step_updates["result_summary"] = f"{tool_result.summary} (Recovery scheduled: {reason})"
                    db.agent_steps.update_one({"_id": step_id}, {"$set": step_updates})
                    recovery_engine.apply_backoff(attempt_count)
                    continue
                else:
                    step_updates["status"] = "FAILED"
                    step_updates["completed_at"] = datetime.now(timezone.utc)
                    db.agent_steps.update_one({"_id": step_id}, {"$set": step_updates})
                    return False

            # Execute independent verification in MongoDB
            verification = verifier.verify_step(
                tool=tool,
                input_data=step["action_input"],
                result=tool_result,
                context=context,
                db=db
            )

            step_updates["verification_status"] = "PASSED" if verification.passed else "FAILED"
            step_updates["verification_evidence"] = verification.evidence

            if verification.passed:
                step_updates["status"] = "SUCCEEDED"
                step_updates["completed_at"] = datetime.now(timezone.utc)
                db.agent_steps.update_one({"_id": step_id}, {"$set": step_updates})
                return True
            else:
                step_updates["status"] = "FAILED"
                step_updates["error_message"] = f"Post-execution verification failed: {verification.details}"
                step_updates["completed_at"] = datetime.now(timezone.utc)
                db.agent_steps.update_one({"_id": step_id}, {"$set": step_updates})
                return False

        # Max retries exceeded
        db.agent_steps.update_one(
            {"_id": step_id},
            {"$set": {"status": "FAILED", "completed_at": datetime.now(timezone.utc)}}
        )
        return False

    def retry_step(self, db: Database, user_id: Union[str, int], run_id: str, step_id: str) -> Dict[str, Any]:
        """
        Manually re-triggers a specific failed step in an agent run within MongoDB.
        """
        user_id_str = str(user_id)
        run_query = {"$and": [build_id_query(run_id), {"user_id": user_id_str}]}
        run_doc = db.agent_runs.find_one(run_query)
        if not run_doc:
            raise ValueError(f"Run #{run_id} not found or access denied.")

        step_query = {"$and": [build_id_query(step_id), {"agent_run_id": str(run_doc["_id"])}]}
        step = db.agent_steps.find_one(step_query)
        if not step:
            # Fallback query matching step_order if step_id was an order number
            step = db.agent_steps.find_one({"agent_run_id": str(run_doc["_id"]), "step_order": int(step_id)}) if step_id.isdigit() else None
        
        if not step:
            raise ValueError(f"Step #{step_id} not found.")

        # Update run to RUNNING
        db.agent_runs.update_one({"_id": run_doc["_id"]}, {"$set": {"status": "RUNNING"}})

        # Preserve recovery audit trail
        prev_attempts = step.get("attempt_count", 1)
        prev_recoveries = step.get("recovery_count", 0) + 1

        db.agent_steps.update_one(
            {"_id": step["_id"]},
            {"$set": {
                "status": "PENDING",
                "error_message": None,
                "verification_status": "UNVERIFIED",
                "verification_evidence": None,
                "attempt_count": prev_attempts,
                "recovery_count": prev_recoveries,
                "recovered": True
            }}
        )

        fresh_step = db.agent_steps.find_one({"_id": step["_id"]})

        # Re-execute without synthetic failure injection
        step_ok = self._execute_and_verify_step(
            db=db,
            user_id=user_id_str,
            run_id=str(run_doc["_id"]),
            step=fresh_step,
            inject_error=False
        )

        # If this step recovered successfully, resume subsequent skipped/pending steps
        if step_ok:
            subsequent_steps = list(db.agent_steps.find({
                "agent_run_id": str(run_doc["_id"]),
                "step_order": {"$gt": step.get("step_order", 0)},
                "status": {"$in": ["SKIPPED", "PENDING"]}
            }).sort("step_order", 1))

            for sub_step in subsequent_steps:
                db.agent_steps.update_one(
                    {"_id": sub_step["_id"]},
                    {"$set": {"status": "PENDING", "error_message": None}}
                )
                sub_fresh = db.agent_steps.find_one({"_id": sub_step["_id"]})
                sub_ok = self._execute_and_verify_step(
                    db=db,
                    user_id=user_id_str,
                    run_id=str(run_doc["_id"]),
                    step=sub_fresh,
                    inject_error=False
                )
                if not sub_ok:
                    # If a downstream step fails, halt further execution
                    break

        # Update run status based on all steps
        all_steps = list(db.agent_steps.find({"agent_run_id": str(run_doc["_id"])}).sort("step_order", 1))
        succeeded = [s for s in all_steps if s.get("status") == "SUCCEEDED"]
        failed = [s for s in all_steps if s.get("status") == "FAILED"]
        skipped = [s for s in all_steps if s.get("status") == "SKIPPED"]
        pending = [s for s in all_steps if s.get("status") == "PENDING"]

        if len(succeeded) == len(all_steps):
            new_run_status = "SUCCEEDED"
            summary = f"All {len(all_steps)} step(s) successfully executed and verified after recovery."
        elif failed:
            new_run_status = "PARTIAL" if succeeded else "FAILED"
            first_fail = failed[0]
            summary = f"Step #{step.get('step_order')} recovered. Run halted at Step #{first_fail.get('step_order')} ({first_fail.get('action_type')})."
        elif skipped:
            new_run_status = "PARTIAL"
            summary = f"Step #{step.get('step_order')} recovered. {len(succeeded)}/{len(all_steps)} completed ({len(skipped)} skipped)."
        else:
            new_run_status = "PARTIAL"
            summary = f"Recovery executed: {len(succeeded)}/{len(all_steps)} steps verified."

        db.agent_runs.update_one(
            {"_id": run_doc["_id"]},
            {"$set": {
                "status": new_run_status,
                "execution_summary": summary,
                "completed_at": datetime.now(timezone.utc)
            }}
        )

        updated_step = db.agent_steps.find_one({"_id": step["_id"]})
        return serialize_agent_step(updated_step)

executor = AgentExecutor()
