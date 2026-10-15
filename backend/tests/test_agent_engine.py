import pytest

@pytest.fixture
def auth_headers(client):
    res = client.post("/api/auth/register", json={
        "full_name": "Bruce Banner",
        "email": "bruce@avengers.org",
        "password": "GammaPassword99!",
        "confirm_password": "GammaPassword99!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_multi_step_agent_execution_mongodb(client, auth_headers):
    # Submit a natural language multi-step instruction
    request_payload = {
        "request": "Create an urgent task for AI security review, take a note about model weights, and summarize tasks",
        "simulate_failure": False
    }

    res = client.post("/api/agent/runs", json=request_payload, headers=auth_headers)
    assert res.status_code == 201
    run_data = res.json()

    assert run_data["status"] == "SUCCEEDED"
    assert len(run_data["steps"]) >= 2
    
    # Check that each executed step has verified outcome
    for step in run_data["steps"]:
        assert step["status"] == "SUCCEEDED"
        assert step["verification_status"] == "PASSED"
        assert step["verification_evidence"] is not None
        assert step["attempt_count"] >= 1

    # Check tasks in user's list from MongoDB
    tasks_res = client.get("/api/tasks", headers=auth_headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) >= 1
    assert any("AI security review" in t["title"] or "ai security review" in t["title"].lower() for t in tasks)

    # Check notes in user's list from MongoDB
    notes_res = client.get("/api/notes", headers=auth_headers)
    assert notes_res.status_code == 200
    notes = notes_res.json()
    assert len(notes) >= 1
