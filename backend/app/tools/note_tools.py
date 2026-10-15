from datetime import datetime, timezone
from typing import Dict, Any
from pymongo.database import Database
from app.tools.base import BaseTool, ToolContext, ToolResult, VerificationResult
from app.db.serializers import build_id_query

class NoteCreateTool(BaseTool):
    name = "note.create"
    description = "Create a new note with a title and content."
    input_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Title of the note"},
            "content": {"type": "string", "description": "Content of the note"}
        },
        "required": ["title", "content"]
    }
    is_idempotent = False
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Note creation database lock [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        title = input_data.get("title", "").strip()
        content = input_data.get("content", "").strip()

        if not title or not content:
            return ToolResult(
                success=False,
                error="ValidationError: Both title and content are required for note.create.",
                summary="Validation failed for note.create",
                retryable=False
            )

        now = datetime.now(timezone.utc)
        note_doc = {
            "user_id": str(context.user_id),
            "title": title,
            "content": content,
            "created_at": now,
            "updated_at": now
        }
        res = db.notes.insert_one(note_doc)
        note_id = str(res.inserted_id)

        return ToolResult(
            success=True,
            data={
                "note_id": note_id,
                "title": title,
                "created_at": now.isoformat()
            },
            summary=f"Note '{title}' created with ID #{note_id}."
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(
                passed=False,
                evidence={"error": result.error},
                details="Verification aborted: Step execution failed."
            )

        note_id = result.data.get("note_id")
        query = {"$and": [build_id_query(note_id), {"user_id": str(context.user_id)}]}
        persisted_note = db.notes.find_one(query)
        
        if not persisted_note:
            return VerificationResult(
                passed=False,
                evidence={"note_id": str(note_id)},
                details=f"Verification failed: Note #{note_id} could not be verified in MongoDB Atlas."
            )

        return VerificationResult(
            passed=True,
            evidence={
                "verified_note_id": str(persisted_note.get("_id", note_id)),
                "verified_title": persisted_note.get("title"),
                "content_length": len(persisted_note.get("content", "")),
                "persisted_in_mongodb": True,
                "storage_engine": "MongoDB Atlas",
                "verified_at": datetime.now(timezone.utc).isoformat()
            },
            details=f"Verified: Note #{note_id} queried and verified in MongoDB Atlas."
        )


class NoteListTool(BaseTool):
    name = "note.list"
    description = "Retrieve saved notes for the user."
    input_schema = {
        "type": "object",
        "properties": {
            "limit": {"type": "integer", "default": 10}
        }
    }
    is_idempotent = True
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Note list query failed [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        limit = min(input_data.get("limit", 10), 50)
        cursor = db.notes.find({"user_id": str(context.user_id)}).sort("created_at", -1).limit(limit)
        
        notes_data = [
            {
                "id": str(n.get("_id", n.get("id"))),
                "title": n.get("title"),
                "preview": (n.get("content", "")[:80] + "...") if len(n.get("content", "")) > 80 else n.get("content", ""),
                "created_at": n.get("created_at").isoformat() if hasattr(n.get("created_at"), "isoformat") else str(n.get("created_at"))
            }
            for n in cursor
        ]

        return ToolResult(
            success=True,
            data={"count": len(notes_data), "notes": notes_data},
            summary=f"Found {len(notes_data)} note(s)."
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(passed=False, evidence={"error": result.error}, details="Verification failed.")

        return VerificationResult(
            passed=True,
            evidence={"count": result.data.get("count", 0), "storage_engine": "MongoDB Atlas"},
            details="Verified: Note list query executed cleanly against MongoDB Atlas."
        )
