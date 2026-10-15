import pytest

def test_multi_device_cross_device_synchronization(client):
    """
    Validates cross-device data synchronization using MongoDB Atlas as the single source of truth.
    Simulates Device 1 (Desktop) and Device 2 (Mobile/Laptop) logging into the same account simultaneously.
    """
    # 1. Register a user from Device 1
    reg_payload = {
        "full_name": "Tony Stark",
        "email": "tony.multidevice@stark.com",
        "password": "MultiDeviceSecret123!",
        "confirm_password": "MultiDeviceSecret123!"
    }
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    device_1_token = res_reg.json()["access_token"]
    headers_device_1 = {"Authorization": f"Bearer {device_1_token}"}

    # 2. Authenticate from Device 2 with the same credentials (concurrent multi-device session)
    login_payload = {
        "email": "tony.multidevice@stark.com",
        "password": "MultiDeviceSecret123!"
    }
    res_login = client.post("/api/auth/login", json=login_payload)
    assert res_login.status_code == 200
    device_2_token = res_login.json()["access_token"]
    headers_device_2 = {"Authorization": f"Bearer {device_2_token}"}

    # Both devices hold active valid sessions
    assert device_1_token is not None
    assert device_2_token is not None

    # 3. Device 1 creates a task and a note
    task_res = client.post("/api/tasks", json={
        "title": "Device 1 Task: Security Perimeter Scan",
        "description": "Created from Desktop workstation",
        "priority": "HIGH"
    }, headers=headers_device_1)
    assert task_res.status_code == 201
    created_task_id = task_res.json()["id"]

    note_res = client.post("/api/notes", json={
        "title": "Device 1 Note: Network Audit Logs",
        "content": "Port 8000 opened for FastAPI services"
    }, headers=headers_device_1)
    assert note_res.status_code == 201
    created_note_id = note_res.json()["id"]

    # 4. Device 2 queries tasks and notes (simulating manual sync or revisit refresh)
    # Must immediately see the records created on Device 1
    device_2_tasks = client.get("/api/tasks", headers=headers_device_2).json()
    assert len(device_2_tasks) == 1
    assert device_2_tasks[0]["id"] == created_task_id
    assert device_2_tasks[0]["title"] == "Device 1 Task: Security Perimeter Scan"

    device_2_notes = client.get("/api/notes", headers=headers_device_2).json()
    assert len(device_2_notes) == 1
    assert device_2_notes[0]["id"] == created_note_id
    assert device_2_notes[0]["title"] == "Device 1 Note: Network Audit Logs"

    # 5. Device 2 updates the task status to DONE
    patch_res = client.patch(f"/api/tasks/{created_task_id}", json={
        "status": "DONE"
    }, headers=headers_device_2)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "DONE"

    # 6. Device 1 queries the task (simulating page revisit/manual sync)
    device_1_tasks = client.get("/api/tasks", headers=headers_device_1).json()
    assert len(device_1_tasks) == 1
    assert device_1_tasks[0]["status"] == "DONE"

    # 7. Device 1 triggers an agent run
    run_res = client.post("/api/agent/runs", json={
        "request": "Add an urgent task to calibrate sensors, record a note, and summarize workload",
        "simulate_failure": False
    }, headers=headers_device_1)
    assert run_res.status_code == 201
    run_id = run_res.json()["id"]

    # 8. Device 2 queries agent runs and stats (cross-device history visibility)
    device_2_runs = client.get("/api/agent/runs", headers=headers_device_2).json()
    assert any(r["id"] == run_id for r in device_2_runs)

    device_2_stats = client.get("/api/agent/stats", headers=headers_device_2).json()
    assert device_2_stats["total_runs"] >= 1
    assert device_2_stats["total_tasks"] >= 2

def test_multi_device_user_isolation(client):
    """
    Validates that user data isolation is strictly preserved across devices.
    User B on Device 3 cannot read User A's data created from Device 1 or 2.
    """
    # User A on Device 1
    reg_a = client.post("/api/auth/register", json={
        "full_name": "User Alice",
        "email": "alice.multidevice@jarvis.ai",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B on Device 3
    reg_b = client.post("/api/auth/register", json={
        "full_name": "User Bob",
        "email": "bob.multidevice@jarvis.ai",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Alice creates task
    t_res = client.post("/api/tasks", json={
        "title": "Alice Confidential Multi-Device Project",
        "priority": "HIGH"
    }, headers=headers_a)
    alice_task_id = t_res.json()["id"]

    # Bob lists tasks - must receive 0 tasks
    bob_tasks = client.get("/api/tasks", headers=headers_b).json()
    assert len(bob_tasks) == 0

    # Bob cannot access or patch Alice's task
    bob_patch = client.patch(f"/api/tasks/{alice_task_id}", json={"status": "DONE"}, headers=headers_b)
    assert bob_patch.status_code == 404

def test_expired_or_invalid_session_handling(client):
    """
    Verifies that requests with invalid, missing, or malformed tokens return 401 Unauthorized.
    """
    # Malformed token
    res_bad = client.get("/api/tasks", headers={"Authorization": "Bearer invalid.expired.token"})
    assert res_bad.status_code == 401

    # Missing Authorization header
    res_no_auth = client.get("/api/tasks")
    assert res_no_auth.status_code == 401
