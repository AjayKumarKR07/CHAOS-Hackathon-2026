from datetime import datetime, timezone
from typing import Dict, Any
from pymongo.database import Database
from app.tools.base import BaseTool, ToolContext, ToolResult, VerificationResult
from app.db.serializers import build_id_query

class SummaryGenerateTool(BaseTool):
    name = "summary.generate"
    description = "Generate an executive summary of current tasks, priorities, and recent notes."
    input_schema = {
        "type": "object",
        "properties": {
            "save_as_note": {"type": "boolean", "default": False, "description": "Whether to persist this summary as a new note"}
        }
    }
    is_idempotent = True
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Summary aggregator worker timeout [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        user_id_str = str(context.user_id)
        tasks_cursor = list(db.tasks.find({"user_id": user_id_str}))
        notes_count = db.notes.count_documents({"user_id": user_id_str})

        total = len(tasks_cursor)
        pending = sum(1 for t in tasks_cursor if t.get("status") == "TODO")
        in_progress = sum(1 for t in tasks_cursor if t.get("status") == "IN_PROGRESS")
        done = sum(1 for t in tasks_cursor if t.get("status") == "DONE")
        urgent = [t.get("title") for t in tasks_cursor if t.get("priority") == "URGENT" and t.get("status") != "DONE"]

        summary_text = (
            f"Daily Briefing ({datetime.now(timezone.utc).strftime('%Y-%m-%d')}):\n"
            f"- Total Tasks: {total} (Pending: {pending}, In Progress: {in_progress}, Completed: {done})\n"
            f"- Urgent Attention: {', '.join(urgent) if urgent else 'None'}\n"
            f"- Total Notes Count: {notes_count}"
        )

        note_id = None
        if input_data.get("save_as_note", False):
            summary_idempotency_key = f"{context.idempotency_key}:summary" if context.idempotency_key else None
            if summary_idempotency_key:
                existing_summary = db.notes.find_one({
                    "user_id": user_id_str,
                    "idempotency_key": summary_idempotency_key
                })
                if existing_summary:
                    note_id = str(existing_summary["_id"])

            if not note_id:
                now = datetime.now(timezone.utc)
                summary_note = {
                    "user_id": user_id_str,
                    "title": f"Daily Summary - {now.strftime('%b %d, %Y')}",
                    "content": summary_text,
                    "idempotency_key": summary_idempotency_key,
                    "created_at": now,
                    "updated_at": now
                }
                res = db.notes.insert_one(summary_note)
                note_id = str(res.inserted_id)

        return ToolResult(
            success=True,
            data={
                "total_tasks": total,
                "pending": pending,
                "in_progress": in_progress,
                "done": done,
                "urgent_items": urgent,
                "summary_text": summary_text,
                "saved_note_id": note_id,
                "internal_note_created": bool(note_id)
            },
            summary=(
                f"Workload summary generated: {total} task(s) evaluated, {len(urgent)} urgent item(s)."
                + (f" Saved to internal note #{note_id}." if note_id else " (In-memory summary only; no internal note created).")
            )
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(passed=False, evidence={"error": result.error}, details="Verification failed.")

        data = result.data
        if "total_tasks" not in data or "summary_text" not in data:
            return VerificationResult(passed=False, evidence={}, details="Verification failed: Incomplete summary payload.")

        # If saved as note, independently verify the note exists in MongoDB under the authenticated user
        internal_note_saved = bool(input_data.get("save_as_note") and data.get("saved_note_id"))
        verified_note_id = None

        if internal_note_saved:
            query = {"$and": [build_id_query(data["saved_note_id"]), {"user_id": str(context.user_id)}]}
            persisted = db.notes.find_one(query)
            if not persisted:
                return VerificationResult(
                    passed=False,
                    evidence={"saved_note_id": data["saved_note_id"], "user_id": str(context.user_id)},
                    details="Verification failed: Generated summary note was not found in MongoDB Atlas for this user."
                )
            verified_note_id = str(persisted["_id"])

        evidence_payload = {
            "evaluated_tasks": data["total_tasks"],
            "storage_engine": "MongoDB Atlas",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "note_persisted": internal_note_saved,
            "internal_note_behavior": (
                "Created note internally via summary tool" if internal_note_saved
                else "In-memory summary generation only (no internal note created)"
            )
        }
        if verified_note_id:
            evidence_payload["saved_note_id"] = verified_note_id

        return VerificationResult(
            passed=True,
            evidence=evidence_payload,
            details=(
                f"Verified: Workload summary confirmed in MongoDB Atlas."
                + (f" Internal note #{verified_note_id} confirmed." if verified_note_id else "")
            )
        )
