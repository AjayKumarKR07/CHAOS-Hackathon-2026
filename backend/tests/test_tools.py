import pytest
from app.tools.registry import tool_registry

def test_tool_allowlist_and_specs():
    specs = tool_registry.get_all_tool_specs()
    assert len(specs) >= 5
    
    names = [s["name"] for s in specs]
    assert "task.create" in names
    assert "task.update" in names
    assert "task.list" in names
    assert "note.create" in names
    assert "summary.generate" in names
    assert "notification.simulate" in names

    # Arbitrary shell or unrestricted code must NOT be in the allowlist
    assert not tool_registry.is_permitted("bash")
    assert not tool_registry.is_permitted("exec")
    assert not tool_registry.is_permitted("shell.run")
    assert not tool_registry.is_permitted("eval")
