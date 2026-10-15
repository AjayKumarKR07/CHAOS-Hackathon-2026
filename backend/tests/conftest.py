import pytest
import mongomock
from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.core.database import get_db, create_indexes

# Create an isolated in-memory test database for deterministic, safe tests
test_mongo_client = mongomock.MongoClient()
test_db = test_mongo_client["jarvis_test_db"]
create_indexes(test_db)

def override_get_db():
    return test_db

fastapi_app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def clean_test_collections():
    """Wipes test collections before each test run to guarantee total test isolation."""
    for col_name in ["users", "tasks", "notes", "agent_runs", "agent_steps", "execution_logs"]:
        test_db[col_name].delete_many({})
    yield

@pytest.fixture
def mock_db():
    return test_db

@pytest.fixture
def client():
    return TestClient(fastapi_app)
