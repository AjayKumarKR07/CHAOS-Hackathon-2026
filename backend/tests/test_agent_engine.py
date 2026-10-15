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

def test_exact_three_step_instruction_execution_and_verification(client, auth_headers):
    # Prompt requested in problem statement
    prompt = "Create an urgent task to review API security, save a note containing the audit findings, and generate a summary of my workload"
    res = client.post("/api/agent/runs", json={"request": prompt, "simulate_failure": False}, headers=auth_headers)
    assert res.status_code == 201
    run_data = res.json()

    assert run_data["status"] == "SUCCEEDED"
    steps = run_data["steps"]
    assert len(steps) == 3, f"Expected exactly 3 steps, got {len(steps)}"

    # Step 1: task.create
    assert steps[0]["action_type"] == "task.create"
    assert steps[0]["status"] == "SUCCEEDED"
    assert steps[0]["action_input"]["priority"] == "URGENT"
    assert "review api security" in steps[0]["action_input"]["title"].lower()

    # Step 2: note.create
    assert steps[1]["action_type"] == "note.create"
    assert steps[1]["status"] == "SUCCEEDED"
    assert "Audit Findings" in steps[1]["action_input"]["title"]
    assert "Scope:" in steps[1]["action_input"]["content"]

    # Step 3: summary.generate
    assert steps[2]["action_type"] == "summary.generate"
    assert steps[2]["status"] == "SUCCEEDED"
    assert steps[2]["action_input"]["save_as_note"] is False

    # Verify note persisted in MongoDB and belongs to authenticated user
    notes = client.get("/api/notes", headers=auth_headers).json()
    audit_notes = [n for n in notes if "Audit Findings" in n["title"]]
    assert len(audit_notes) == 1
    assert "JWT" in audit_notes[0]["content"]

    # Verify evidence inspector endpoint for note step
    step_2_id = steps[1]["id"]
    ev_res = client.get(f"/api/agent/runs/{run_data['id']}/steps/{step_2_id}/evidence", headers=auth_headers)
    assert ev_res.status_code == 200
    ev = ev_res.json()
    assert ev["verification_status"] == "PASSED"
    assert ev["record_ids"]["note_id"] == audit_notes[0]["id"]
    assert "db.notes.find_one" in ev["query_summary"]

def test_partial_failure_skipped_steps_and_recovery(client, auth_headers):
    prompt = "Create an urgent task to review API security, save a note containing the audit findings, and generate a summary of my workload"
    
    # Run with injected failure on step 2
    res = client.post("/api/agent/runs", json={
        "request": prompt,
        "simulate_failure": True,
        "failure_step": 2
    }, headers=auth_headers)
    assert res.status_code == 201
    run_data = res.json()

    assert run_data["status"] == "PARTIAL"
    steps = run_data["steps"]
    assert len(steps) == 3
    assert steps[0]["status"] == "SUCCEEDED"
    assert steps[1]["status"] == "FAILED"
    assert steps[2]["status"] == "SKIPPED"
    assert "Skipped: 1 dependent action(s)" in run_data["execution_summary"]

    # Retry step 2 -> should recover step 2 AND resume step 3 to complete run!
    retry_res = client.post(f"/api/agent/runs/{run_data['id']}/steps/{steps[1]['id']}/retry", headers=auth_headers)
    assert retry_res.status_code == 200

    # Fetch updated run
    final_run = client.get(f"/api/agent/runs/{run_data['id']}", headers=auth_headers).json()
    assert final_run["status"] == "SUCCEEDED"
    for s in final_run["steps"]:
        assert s["status"] == "SUCCEEDED"

