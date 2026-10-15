import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from pymongo.database import Database
from app.tools.base import BaseTool, ToolContext, ToolResult, VerificationResult

class NotificationSimulateTool(BaseTool):
    name = "notification.simulate"
    description = "Send a simulated notification or webhook dispatch (Explicitly labeled sandbox integration)."
    input_schema = {
        "type": "object",
        "properties": {
            "channel": {"type": "string", "enum": ["EMAIL", "SLACK", "SMS", "IN_APP"], "default": "IN_APP"},
            "recipient": {"type": "string", "description": "Destination address or username"},
            "message": {"type": "string", "description": "Notification content"}
        },
        "required": ["message"]
    }
    is_idempotent = True
    is_safe_to_retry = True

    def execute(self, input_data: Dict[str, Any], context: ToolContext, db: Database) -> ToolResult:
        if context.simulate_failure:
            return ToolResult(
                success=False,
                error="SimulatedToolError: Upstream notification gateway timeout [Simulated Injected Failure]",
                summary="Tool execution interrupted by simulated test failure.",
                retryable=True
            )

        channel = input_data.get("channel", "IN_APP").upper()
        recipient = input_data.get("recipient", "Current User")
        message = input_data.get("message", "")

        dispatch_receipt_id = f"sim-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)

        # Persist audit record in MongoDB execution_logs
        log_doc = {
            "agent_run_id": str(context.agent_run_id),
            "user_id": str(context.user_id),
            "step_order": context.step_order,
            "channel": channel,
            "recipient": recipient,
            "message": message,
            "receipt_id": dispatch_receipt_id,
            "timestamp": now,
            "type": "SIMULATED_NOTIFICATION"
        }
        db.execution_logs.insert_one(log_doc)

        return ToolResult(
            success=True,
            data={
                "channel": channel,
                "recipient": recipient,
                "message": message,
                "simulated_receipt_id": dispatch_receipt_id,
                "dispatched_at": now.isoformat(),
                "integration_mode": "SIMULATED_SANDBOX"
            },
            summary=f"[SIMULATED {channel} DISPATCH] Sent to '{recipient}': {message[:60]}... (Receipt: {dispatch_receipt_id})"
        )

    def verify(self, input_data: Dict[str, Any], result: ToolResult, context: ToolContext, db: Database) -> VerificationResult:
        if not result.success:
            return VerificationResult(passed=False, evidence={"error": result.error}, details="Verification failed.")

        receipt = result.data.get("simulated_receipt_id")
        persisted_log = db.execution_logs.find_one({"receipt_id": receipt, "user_id": str(context.user_id)})
        
        if not persisted_log:
            return VerificationResult(
                passed=False,
                evidence={"receipt_id": receipt},
                details="Verification failed: Audit dispatch record not found in MongoDB."
            )

        return VerificationResult(
            passed=True,
            evidence={
                "receipt_id": receipt,
                "sandbox_confirmed": True,
                "storage_engine": "MongoDB Atlas execution_logs",
                "integration_status": "Simulated external provider acknowledged receipt."
            },
            details=f"Verified: Simulated dispatch #{receipt} recorded in MongoDB Atlas audit log."
        )
