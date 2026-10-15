import pytest
from app.agent.recovery import recovery_engine

def test_idempotency_key_deterministic():
    key1 = recovery_engine.generate_idempotency_key(
        user_id="user_123",
        run_id="run_456",
        step_order=1,
        action_type="task.create",
        action_input={"title": "Deploy Service"}
    )
    key2 = recovery_engine.generate_idempotency_key(
        user_id="user_123",
        run_id="run_456",
        step_order=1,
        action_type="task.create",
        action_input={"title": "Deploy Service"}
    )
    assert key1 == key2
    assert len(key1) == 24  # 24-char hex key

def test_idempotency_key_differentiates_steps():
    key1 = recovery_engine.generate_idempotency_key(
        user_id="user_123",
        run_id="run_456",
        step_order=1,
        action_type="task.create",
        action_input={"title": "Deploy Service"}
    )
    key2 = recovery_engine.generate_idempotency_key(
        user_id="user_123",
        run_id="run_456",
        step_order=2,
        action_type="task.create",
        action_input={"title": "Deploy Service"}
    )
    assert key1 != key2

def test_duplicate_task_creation_prevention(client):
    # Register user
    reg = client.post("/api/auth/register", json={
        "full_name": "Idempotency Tester",
        "email": "idempotent@jarvis.ai",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Run agent twice with identical request
    res1 = client.post("/api/agent/runs", json={
        "request": "Create a task for server update and record a note about ports",
        "simulate_failure": False
    }, headers=headers)
    assert res1.status_code == 201
    run1 = res1.json()

    # Steps in run 1 have unique idempotency keys
    keys = [s["idempotency_key"] for s in run1["steps"] if s.get("idempotency_key")]
    assert len(keys) == len(set(keys))
