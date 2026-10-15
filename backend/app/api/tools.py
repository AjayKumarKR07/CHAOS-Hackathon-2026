from fastapi import APIRouter
from app.tools.registry import tool_registry

router = APIRouter(prefix="/tools", tags=["Tool Registry"])

@router.get("")
def list_available_tools():
    """Returns all registered and permitted tools with their schemas."""
    return {
        "count": len(tool_registry.get_allowlist()),
        "allowlist": tool_registry.get_allowlist(),
        "tools": tool_registry.get_all_tool_specs()
    }
