import pytest

def test_register_and_login_flow(client):
    # 1. Register a new user
    reg_payload = {
        "full_name": "Tony Stark",
        "email": "tony@stark.com",
        "password": "SecretPassword123!",
        "confirm_password": "SecretPassword123!"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tony@stark.com"
    assert "password_hash" not in data["user"]
    token = data["access_token"]

    # 2. Duplicate registration should be rejected
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Login with correct credentials
    login_res = client.post("/api/auth/login", json={
        "email": "tony@stark.com",
        "password": "SecretPassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login with invalid password
    bad_login = client.post("/api/auth/login", json={
        "email": "tony@stark.com",
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

    # 5. Protected profile endpoint with token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Tony Stark"

    # 6. Protected endpoint without token should fail
    no_auth_res = client.get("/api/auth/me")
    assert no_auth_res.status_code == 401
