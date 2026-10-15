from typing import Dict, List, Optional
from app.tools.base import BaseTool
from app.tools.task_tools import TaskCreateTool, TaskUpdateTool, TaskListTool
from app.tools.note_tools import NoteCreateTool, NoteListTool
from app.tools.summary_tool import SummaryGenerateTool
from app.tools.notification_tool import NotificationSimulateTool

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        tools = [
            TaskCreateTool(),
            TaskUpdateTool(),
            TaskListTool(),
            NoteCreateTool(),
            NoteListTool(),
            SummaryGenerateTool(),
            NotificationSimulateTool(),
        ]
        for tool in tools:
            self.register_tool(tool)

    def register_tool(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def is_permitted(self, name: str) -> bool:
        return name in self._tools

    def get_allowlist(self) -> List[str]:
        return list(self._tools.keys())

    def get_all_tool_specs(self) -> List[dict]:
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.input_schema,
                "is_idempotent": tool.is_idempotent,
                "is_safe_to_retry": tool.is_safe_to_retry
            }
            for tool in self._tools.values()
        ]

tool_registry = ToolRegistry()
