import pytest

def test_user_data_isolation(client):
    # Register User A
    res_a = client.post("/api/auth/register", json={
        "full_name": "User Alpha",
        "email": "alpha@jarvis.ai",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    res_b = client.post("/api/auth/register", json={
        "full_name": "User Beta",
        "email": "beta@jarvis.ai",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a private task
    task_res = client.post("/api/tasks", json={
        "title": "Alpha Confidential Mission",
        "description": "Top secret alpha work",
        "priority": "HIGH"
    }, headers=headers_a)
    assert task_res.status_code == 201
    alpha_task_id = task_res.json()["id"]

    # User A creates a private note
    note_res = client.post("/api/notes", json={
        "title": "Alpha Secret Notes",
        "content": "Classified notes contents"
    }, headers=headers_a)
    assert note_res.status_code == 201
    alpha_note_id = note_res.json()["id"]

    # User B lists tasks - must NOT see User A's task
    beta_tasks = client.get("/api/tasks", headers=headers_b).json()
    assert len(beta_tasks) == 0

    # User B lists notes - must NOT see User A's note
    beta_notes = client.get("/api/notes", headers=headers_b).json()
    assert len(beta_notes) == 0

    # User B attempts to modify User A's task - must receive 404 Not Found
    hack_patch = client.patch(f"/api/tasks/{alpha_task_id}", json={
        "title": "Tampered Title"
    }, headers=headers_b)
    assert hack_patch.status_code == 404

    # User B attempts to delete User A's note - must receive 404 Not Found
    hack_delete = client.delete(f"/api/notes/{alpha_note_id}", headers=headers_b)
    assert hack_delete.status_code == 404

    # User A's task must remain unchanged
    a_tasks = client.get("/api/tasks", headers=headers_a).json()
    assert len(a_tasks) == 1
    assert a_tasks[0]["title"] == "Alpha Confidential Mission"
