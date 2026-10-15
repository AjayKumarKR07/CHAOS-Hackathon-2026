import pytest

@pytest.fixture
def auth_headers(client):
    res = client.post("/api/auth/register", json={
        "full_name": "Natasha Romanoff",
        "email": "natasha@shield.gov",
        "password": "ShieldAgent2026!",
        "confirm_password": "ShieldAgent2026!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_failure_detection_and_safe_recovery_mongodb(client, auth_headers):
    # 1. Trigger agent run with failure injection turned ON
    res = client.post("/api/agent/runs", json={
        "request": "Create a task for database backup, and write a note about encryption keys",
        "simulate_failure": True
    }, headers=auth_headers)

    assert res.status_code == 201
    run_data = res.json()
    assert run_data["status"] in ["FAILED", "PARTIAL"]
    assert run_data["failure_injected"] is True

    failed_step = next((s for s in run_data["steps"] if s["status"] == "FAILED"), None)
    assert failed_step is not None
    assert "SimulatedToolError" in failed_step["error_message"]
    assert failed_step["verification_status"] == "FAILED"

    # 2. Trigger safe recovery via Step Retry endpoint
    retry_res = client.post(
        f"/api/agent/runs/{run_data['id']}/steps/{failed_step['id']}/retry",
        headers=auth_headers
    )
    assert retry_res.status_code == 200
    retried_step_data = retry_res.json()

    # 3. Assert step successfully recovered, executed, and verified in MongoDB
    assert retried_step_data["status"] == "SUCCEEDED"
    assert retried_step_data["verification_status"] == "PASSED"
    assert retried_step_data["verification_evidence"] is not None

    # 4. Check run status update in MongoDB
    updated_run_res = client.get(f"/api/agent/runs/{run_data['id']}", headers=auth_headers)
    assert updated_run_res.status_code == 200
    assert updated_run_res.json()["status"] in ["SUCCEEDED", "PARTIAL"]

def test_permanent_errors_not_retried_automatically():
    from app.agent.recovery import recovery_engine
    from app.tools.registry import tool_registry

    tool = tool_registry.get_tool("task.create")
    assert tool is not None

    # Validation errors must NOT be retry eligible
    eligible, reason = recovery_engine.is_retry_eligible(
        tool=tool,
        attempt_count=1,
        max_attempts=3,
        error_message="ValidationError: Task title cannot be empty."
    )
    assert eligible is False
    assert "validation failed" in reason.lower()

    # Authentication errors must NOT be retry eligible
    eligible, reason = recovery_engine.is_retry_eligible(
        tool=tool,
        attempt_count=1,
        max_attempts=3,
        error_message="Unauthorized: Invalid or expired JWT token"
    )
    assert eligible is False
    assert "authentication/authorization" in reason.lower()

    # Resource not found errors must NOT be retry eligible
    eligible, reason = recovery_engine.is_retry_eligible(
        tool=tool,
        attempt_count=1,
        max_attempts=3,
        error_message="NotFoundError: Task 6ad0a682 does not exist"
    )
    assert eligible is False
    assert "not found" in reason.lower()

    # Transient error must be retry eligible
    eligible, reason = recovery_engine.is_retry_eligible(
        tool=tool,
        attempt_count=1,
        max_attempts=3,
        error_message="NetworkTimeoutError: Upstream socket connection timed out"
    )
    assert eligible is True
    assert "transient" in reason.lower()

