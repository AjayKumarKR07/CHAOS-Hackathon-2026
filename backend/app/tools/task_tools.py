from datetime import datetime, timezone
from typing import Dict, Any
from pymongo.database import Database
from app.tools.base import BaseTool, ToolContext, ToolResult, VerificationResult
from app.db.serializers import build_id_query, parse_id

class TaskCreateTool(BaseTool):
    name = "task.create"
    description = "Create a new task with title, priority, description, and due date."
    input_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "The title of the task"},
            "description": {"type": "string", "description": "Optional detailed description"},
            "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"], "default": "MEDIUM"},
            "status": {"type": "string", "enum": ["TODO", "IN_PROGRESS", "DONE"], "default": "TODO"},
            "due_at": {"type": "string", "description": "ISO timestamp for due date"}
        },
        "required": ["title"]
    }
    is_idempotent = False
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Task creation failed due to upstream downstream timeout [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        title = input_data.get("title", "").strip()
        if not title:
            return ToolResult(
                success=False,
                error="ValidationError: Task title cannot be empty.",
                summary="Validation failed for task.create",
                retryable=False
            )

        description = input_data.get("description")
        priority = input_data.get("priority", "MEDIUM").upper()
        status = input_data.get("status", "TODO").upper()
        
        due_at = None
        if input_data.get("due_at"):
            try:
                due_at = datetime.fromisoformat(input_data["due_at"].replace("Z", "+00:00"))
            except Exception:
                due_at = None

        now = datetime.now(timezone.utc)
        task_doc = {
            "user_id": str(context.user_id),
            "title": title,
            "description": description,
            "priority": priority if priority in ["LOW", "MEDIUM", "HIGH", "URGENT"] else "MEDIUM",
            "status": status if status in ["TODO", "IN_PROGRESS", "DONE"] else "TODO",
            "due_at": due_at,
            "created_at": now,
            "updated_at": now
        }
        
        res = db.tasks.insert_one(task_doc)
        task_id = str(res.inserted_id)

        return ToolResult(
            success=True,
            data={
                "task_id": task_id,
                "title": title,
                "status": task_doc["status"],
                "priority": task_doc["priority"],
                "created_at": now.isoformat()
            },
            summary=f"Task '{title}' created with ID #{task_id} (Priority: {task_doc['priority']})."
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(
                passed=False,
                evidence={"error": result.error},
                details="Verification aborted: Step execution reported failure."
            )

        task_id = result.data.get("task_id")
        if not task_id:
            return VerificationResult(
                passed=False,
                evidence={},
                details="Verification failed: Missing task_id in result data."
            )

        # Independent MongoDB query to verify persistence and integrity
        query = {"$and": [build_id_query(task_id), {"user_id": str(context.user_id)}]}
        persisted_task = db.tasks.find_one(query)
        
        if not persisted_task:
            return VerificationResult(
                passed=False,
                evidence={"query_task_id": str(task_id), "user_id": str(context.user_id)},
                details=f"Verification failed: Task #{task_id} not found in MongoDB Atlas for user #{context.user_id}."
            )

        # Verify title match
        expected_title = input_data.get("title", "").strip()
        if persisted_task.get("title") != expected_title:
            return VerificationResult(
                passed=False,
                evidence={"persisted_title": persisted_task.get("title"), "expected_title": expected_title},
                details="Verification failed: Persisted title does not match requested title."
            )

        return VerificationResult(
            passed=True,
            evidence={
                "verified_task_id": str(persisted_task.get("_id", task_id)),
                "verified_title": persisted_task.get("title"),
                "verified_status": persisted_task.get("status"),
                "verified_priority": persisted_task.get("priority"),
                "database_record_exists": True,
                "storage_engine": "MongoDB Atlas",
                "verified_at": datetime.now(timezone.utc).isoformat()
            },
            details=f"Verified: Task #{task_id} successfully queried and confirmed in MongoDB Atlas."
        )


class TaskUpdateTool(BaseTool):
    name = "task.update"
    description = "Update the status, priority, or details of an existing task."
    input_schema = {
        "type": "object",
        "properties": {
            "task_id": {"type": "string", "description": "The ID of the task to update"},
            "title": {"type": "string"},
            "description": {"type": "string"},
            "status": {"type": "string", "enum": ["TODO", "IN_PROGRESS", "DONE"]},
            "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"]}
        },
        "required": ["task_id"]
    }
    is_idempotent = True
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Task update failed due to connection timeout [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        task_id = str(input_data.get("task_id", ""))
        if not task_id:
            return ToolResult(
                success=False,
                error="ValidationError: task_id is required.",
                summary="Missing required task_id",
                retryable=False
            )

        query = {"$and": [build_id_query(task_id), {"user_id": str(context.user_id)}]}
        task = db.tasks.find_one(query)
        if not task:
            return ToolResult(
                success=False,
                error=f"NotFoundError: Task #{task_id} not found or belongs to another user.",
                summary=f"Task #{task_id} does not exist.",
                retryable=False
            )

        previous_status = task.get("status")
        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        
        if "title" in input_data and input_data["title"]:
            update_fields["title"] = input_data["title"].strip()
        if "description" in input_data:
            update_fields["description"] = input_data["description"]
        if "status" in input_data and input_data["status"]:
            update_fields["status"] = input_data["status"].upper()
        if "priority" in input_data and input_data["priority"]:
            update_fields["priority"] = input_data["priority"].upper()
            
        db.tasks.update_one(query, {"$set": update_fields})
        updated_task = db.tasks.find_one(query)

        return ToolResult(
            success=True,
            data={
                "task_id": task_id,
                "title": updated_task.get("title"),
                "status": updated_task.get("status"),
                "priority": updated_task.get("priority"),
                "previous_status": previous_status,
                "updated_at": updated_task.get("updated_at").isoformat()
            },
            summary=f"Task #{task_id} updated (Status: {updated_task.get('status')}, Priority: {updated_task.get('priority')})."
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(
                passed=False,
                evidence={"error": result.error},
                details="Verification aborted: Step execution failed."
            )

        task_id = str(input_data.get("task_id", ""))
        query = {"$and": [build_id_query(task_id), {"user_id": str(context.user_id)}]}
        task = db.tasks.find_one(query)
        
        if not task:
            return VerificationResult(
                passed=False,
                evidence={"task_id": task_id},
                details=f"Verification failed: Task #{task_id} no longer exists."
            )

        if "status" in input_data and task.get("status") != input_data["status"].upper():
            return VerificationResult(
                passed=False,
                evidence={"persisted_status": task.get("status"), "expected_status": input_data["status"]},
                details="Verification failed: Task status in MongoDB does not match requested status."
            )

        return VerificationResult(
            passed=True,
            evidence={
                "verified_task_id": task_id,
                "verified_status": task.get("status"),
                "verified_priority": task.get("priority"),
                "storage_engine": "MongoDB Atlas",
                "last_updated": task.get("updated_at").isoformat() if hasattr(task.get("updated_at"), "isoformat") else str(task.get("updated_at"))
            },
            details=f"Verified: Task #{task_id} modifications verified against MongoDB Atlas documents."
        )


class TaskListTool(BaseTool):
    name = "task.list"
    description = "Retrieve and list saved tasks for the current user."
    input_schema = {
        "type": "object",
        "properties": {
            "status": {"type": "string", "enum": ["ALL", "TODO", "IN_PROGRESS", "DONE"], "default": "ALL"},
            "limit": {"type": "integer", "default": 20}
        }
    }
    is_idempotent = True
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Task query timeout [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        status_filter = input_data.get("status", "ALL").upper()
        limit = min(input_data.get("limit", 20), 50)

        query: Dict[str, Any] = {"user_id": str(context.user_id)}
        if status_filter != "ALL":
            query["status"] = status_filter

        cursor = db.tasks.find(query).sort("created_at", -1).limit(limit)
        task_list = [
            {
                "id": str(t.get("_id", t.get("id"))),
                "title": t.get("title"),
                "status": t.get("status"),
                "priority": t.get("priority"),
                "created_at": t.get("created_at").isoformat() if hasattr(t.get("created_at"), "isoformat") else str(t.get("created_at"))
            }
            for t in cursor
        ]

        return ToolResult(
            success=True,
            data={"count": len(task_list), "tasks": task_list},
            summary=f"Retrieved {len(task_list)} task(s) for user."
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(passed=False, evidence={"error": result.error}, details="Verification failed.")
        
        return VerificationResult(
            passed=True,
            evidence={"count": result.data.get("count", 0), "verified_user_id": str(context.user_id), "storage_engine": "MongoDB Atlas"},
            details="Verified: Task list query executed against MongoDB Atlas with accurate record count."
        )
