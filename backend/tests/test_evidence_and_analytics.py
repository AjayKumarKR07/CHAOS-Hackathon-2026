import pytest

@pytest.fixture
def user_a_client(client):
    reg = client.post("/api/auth/register", json={
        "full_name": "Tony Stark",
        "email": "tony_analytics@stark.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token = reg.json()["access_token"]
    return client, {"Authorization": f"Bearer {token}"}

@pytest.fixture
def user_b_headers(client):
    reg = client.post("/api/auth/register", json={
        "full_name": "Justin Hammer",
        "email": "justin@hammer.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_verification_evidence_endpoint(user_a_client, user_b_headers):
    client, headers_a = user_a_client

    # Execute a run
    run_res = client.post("/api/agent/runs", json={
        "request": "Create a task to build Arc Reactor mark 85",
        "simulate_failure": False
    }, headers=headers_a)
    assert run_res.status_code == 201
    run_data = run_res.json()
    step_id = run_data["steps"][0]["id"]
    run_id = run_data["id"]

    # 1. User A fetches evidence -> 200 OK
    ev_res = client.get(f"/api/agent/runs/{run_id}/steps/{step_id}/evidence", headers=headers_a)
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["step_id"] == str(step_id)
    assert ev_data["verification_status"] == "PASSED"
    assert ev_data["evidence_available"] is True
    assert "db.tasks.find_one" in ev_data["query_summary"]
    assert "storage_engine" in ev_data
    assert ev_data["storage_engine"] == "MongoDB Atlas"

    # 2. User B tries to fetch User A's evidence -> must be 404 (isolation enforced)
    unauthorized_res = client.get(f"/api/agent/runs/{run_id}/steps/{step_id}/evidence", headers=user_b_headers)
    assert unauthorized_res.status_code == 404
    assert "not found or access denied" in unauthorized_res.json()["detail"]

def test_smart_recovery_analytics_calculations(user_a_client):
    client, headers_a = user_a_client

    # 1. Trigger failure-injected run
    fail_run = client.post("/api/agent/runs", json={
        "request": "Create a task for reactor stabilization",
        "simulate_failure": True
    }, headers=headers_a).json()

    # 2. Check analytics shows unresolved failure
    analytics_before = client.get("/api/agent/analytics/recovery", headers=headers_a).json()
    assert analytics_before["failed_steps"] >= 1
    assert analytics_before["unresolved_failures"] >= 1
    assert analytics_before["recovery_success_rate"] == 0.0

    # 3. Recover the failed step
    failed_step_id = fail_run["steps"][0]["id"]
    client.post(f"/api/agent/runs/{fail_run['id']}/steps/{failed_step_id}/retry", headers=headers_a)

    # 4. Check analytics after recovery -> recovered count increases, rate reaches 100%
    analytics_after = client.get("/api/agent/analytics/recovery", headers=headers_a).json()
    assert analytics_after["recovered_failures"] >= 1
    assert analytics_after["unresolved_failures"] == 0
    assert analytics_after["recovery_success_rate"] == 100.0
    assert analytics_after["retry_attempts"] >= 1
    assert "Percentage of encountered failures" in analytics_after["recovery_rate_definition"]

def test_analytics_date_and_status_filtering(user_a_client):
    client, headers_a = user_a_client

    # Run with filters
    res_today = client.get("/api/agent/analytics/recovery?date_range=today&status_filter=SUCCEEDED", headers=headers_a)
    assert res_today.status_code == 200
    data_today = res_today.json()
    assert data_today["filter_date_range"] == "today"
    assert data_today["filter_status"] == "SUCCEEDED"
