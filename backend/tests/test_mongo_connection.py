import pytest
from app.core.database import mask_mongo_uri, create_indexes

def test_mask_mongo_uri():
    raw_uri = "mongodb+srv://ajay_user:SecretPassword123!@cluster0.gb0mkaf.mongodb.net/jarvis_db?retryWrites=true&w=majority"
    masked = mask_mongo_uri(raw_uri)
    assert "SecretPassword123!" not in masked
    assert "ajay_user:****@" in masked

def test_create_indexes(mock_db):
    create_indexes(mock_db)
    # Check that collections can receive index calls without exception
    assert mock_db is not None

def test_database_ping(mock_db):
    res = mock_db.client.admin.command('ping')
    assert res.get('ok') == 1 or res == {'ok': 1}

def test_health_check_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "database" in data
    assert data["database"]["engine"] == "MongoDB Atlas"

def test_database_unavailable_scenario(monkeypatch):
    from fastapi import HTTPException
    from app.db.mongo import get_database
    import app.db.mongo as mongo_module
    
    # Simulate DB disconnection
    original_db = mongo_module._db
    original_client = mongo_module._client
    mongo_module._db = None
    mongo_module._client = None
    
    def raise_conn_failure():
        from pymongo.errors import ConnectionFailure
        raise ConnectionFailure("Could not connect to MongoDB Atlas cluster")
        
    monkeypatch.setattr(mongo_module, "init_mongo_client", raise_conn_failure)
    
    with pytest.raises(HTTPException) as exc_info:
        get_database()
    assert exc_info.value.status_code == 503
    assert "Database service is currently unavailable" in exc_info.value.detail
    
    # Restore
    mongo_module._db = original_db
    mongo_module._client = original_client

