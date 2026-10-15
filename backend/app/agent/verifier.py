import logging
from pymongo.database import Database
from app.tools.base import BaseTool, ToolContext, ToolResult, VerificationResult

logger = logging.getLogger("jarvis.verifier")

class ExecutionVerifier:
    """
    Independent Verification Engine.
    Ensures that an action is verified against actual MongoDB database state
    instead of merely assuming success.
    """
    def verify_step(
        self,
        tool: BaseTool,
        input_data: dict,
        result: ToolResult,
        context: ToolContext,
        db: Database
    ) -> VerificationResult:
        try:
            logger.info(f"[Verifying in MongoDB] Step #{context.step_order} ({tool.name}) for user #{context.user_id}")
            verification = tool.verify(input_data, result, context, db)
            if verification.passed:
                logger.info(f"[Verification PASSED] Step #{context.step_order} ({tool.name}): {verification.details}")
            else:
                logger.warning(f"[Verification FAILED] Step #{context.step_order} ({tool.name}): {verification.details}")
            return verification
        except Exception as e:
            logger.error(f"[Verification EXCEPTION] Step #{context.step_order}: {str(e)}")
            return VerificationResult(
                passed=False,
                evidence={"exception": str(e)},
                details=f"Verification engine encountered an internal exception: {str(e)}"
            )

verifier = ExecutionVerifier()
