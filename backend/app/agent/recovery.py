import hashlib
import json
import time
import logging
from typing import Dict, Any, Tuple
from app.tools.base import BaseTool

logger = logging.getLogger("jarvis.recovery")

class RecoveryEngine:
    """
    Manages failure classification, idempotency keys, and safe automated retries.
    """
    @staticmethod
    def generate_idempotency_key(user_id: int, run_id: int, step_order: int, action_type: str, action_input: Dict[str, Any]) -> str:
        raw_key = f"{user_id}:{run_id}:{step_order}:{action_type}:{json.dumps(action_input, sort_keys=True)}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:24]

    @staticmethod
    def is_retry_eligible(tool: BaseTool, attempt_count: int, max_attempts: int, error_message: str) -> Tuple[bool, str]:
        """
        Determines if a step can be safely retried.
        """
        if attempt_count >= max_attempts:
            return False, f"Maximum retry limit reached ({attempt_count}/{max_attempts})."

        if not tool.is_safe_to_retry:
            return False, f"Action '{tool.name}' is marked as non-idempotent or non-retryable."

        if "validationerror" in error_message.lower():
            return False, "Input validation failed; retrying with identical inputs will not succeed."

        return True, "Safe transient error candidate for retry with exponential backoff."

    @staticmethod
    def apply_backoff(attempt: int, base_seconds: float = 0.3):
        """
        Exponential backoff delay.
        """
        delay = min(base_seconds * (2 ** (attempt - 1)), 2.0)
        logger.info(f"Applying backoff delay of {delay:.2f}s before retry attempt #{attempt + 1}")
        time.sleep(delay)

recovery_engine = RecoveryEngine()
