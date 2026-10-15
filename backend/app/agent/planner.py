import re
import json
import logging
from typing import List, Dict, Any
from app.tools.registry import tool_registry

logger = logging.getLogger("jarvis.planner")

class PlanStep(dict):
    """Structured plan step representation."""
    pass

class AgentPlanner:
    def __init__(self):
        self.allowlist = tool_registry.get_allowlist()

    def generate_plan(self, user_request: str) -> List[Dict[str, Any]]:
        """
        Decomposes a natural language user request into ordered, validated actionable steps.
        Uses semantic pattern matching and intent analysis to produce structured plans.
        """
        req_clean = user_request.strip().lower()
        steps: List[Dict[str, Any]] = []

        # Multi-intent parsing
        # Check for task creation intents
        task_matches = re.findall(
            r'(?:create|add|make|schedule)\s+(?:a|an)?\s*(urgent|high|medium|low)?\s*task\s*(?:to|for|called|named)?\s*([^,\.;]+)',
            req_clean,
            re.IGNORECASE
        )

        # Check for note creation intents
        note_matches = re.findall(
            r'(?:take|create|add|write)\s+(?:a|an)?\s*note\s*(?:about|titled|for|on)?\s*([^,\.;]+)',
            req_clean,
            re.IGNORECASE
        )

        # Check for summary intent
        wants_summary = any(kw in req_clean for kw in ["summarize", "summary", "briefing", "daily overview", "status report"])

        # Check for notification intent
        wants_notification = any(kw in req_clean for kw in ["notify", "send alert", "send notification", "alert team", "slack", "email"])

        # Check for task listing
        wants_list = any(kw in req_clean for kw in ["show my tasks", "list tasks", "review tasks", "view tasks"])

        step_counter = 1

        if task_matches:
            for priority_match, title_match in task_matches:
                priority = "URGENT" if priority_match == "urgent" else ("HIGH" if priority_match == "high" else "MEDIUM")
                clean_title = title_match.strip().capitalize()
                steps.append({
                    "step_order": step_counter,
                    "action_type": "task.create",
                    "action_input": {
                        "title": clean_title if clean_title else "New Task",
                        "priority": priority,
                        "description": f"Automated task created from user request: '{user_request}'",
                        "status": "TODO"
                    }
                })
                step_counter += 1

        if note_matches:
            for note_content in note_matches:
                clean_content = note_content.strip()
                steps.append({
                    "step_order": step_counter,
                    "action_type": "note.create",
                    "action_input": {
                        "title": f"Note: {clean_content[:30].capitalize()}",
                        "content": clean_content.capitalize()
                    }
                })
                step_counter += 1

        if wants_list and not task_matches:
            steps.append({
                "step_order": step_counter,
                "action_type": "task.list",
                "action_input": {"status": "ALL", "limit": 20}
            })
            step_counter += 1

        if wants_summary:
            steps.append({
                "step_order": step_counter,
                "action_type": "summary.generate",
                "action_input": {
                    "save_as_note": True
                }
            })
            step_counter += 1

        if wants_notification:
            steps.append({
                "step_order": step_counter,
                "action_type": "notification.simulate",
                "action_input": {
                    "channel": "IN_APP",
                    "recipient": "Team / Personal Alert",
                    "message": f"Execution update: Processed request '{user_request[:50]}...'"
                }
            })
            step_counter += 1

        # Fallback multi-step plan if general natural language didn't match specific keywords
        if not steps:
            # Default to an intelligent multi-step plan derived from the prompt
            steps = [
                {
                    "step_order": 1,
                    "action_type": "task.create",
                    "action_input": {
                        "title": user_request[:60].strip().capitalize(),
                        "priority": "HIGH" if "urgent" in req_clean else "MEDIUM",
                        "description": user_request,
                        "status": "TODO"
                    }
                },
                {
                    "step_order": 2,
                    "action_type": "note.create",
                    "action_input": {
                        "title": f"Context: {user_request[:30]}",
                        "content": f"Action items and details logged for request: {user_request}"
                    }
                },
                {
                    "step_order": 3,
                    "action_type": "summary.generate",
                    "action_input": {
                        "save_as_note": False
                    }
                }
            ]

        # Critical Validation: Validate each step against the allowlist
        validated_steps = []
        for s in steps:
            action = s.get("action_type")
            if not tool_registry.is_permitted(action):
                logger.error(f"Security Alert: Blocked unauthorized action type '{action}'")
                continue
            validated_steps.append(s)

        return validated_steps

planner = AgentPlanner()
