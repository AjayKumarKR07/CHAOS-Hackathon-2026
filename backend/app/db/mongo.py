import logging
import re
from typing import Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger("jarvis.mongo")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None

def mask_mongo_uri(uri: str) -> str:
    """Masks credentials in MongoDB connection string for safe error reporting."""
    if not uri:
        return "[NOT_CONFIGURED]"
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', uri)

def init_mongo_client() -> MongoClient:
    """Initializes and returns a connection-pooled MongoClient."""
    global _client, _db
    if _client is not None:
        return _client

    uri = settings.MONGODB_URI.strip()
    if not uri:
        error_msg = "MONGODB_URI is not set in environment. Please check backend/.env."
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    masked = mask_mongo_uri(uri)
    logger.info(f"Connecting to MongoDB cluster: {masked}")

    try:
        _client = MongoClient(
            uri,
            minPoolSize=5,
            maxPoolSize=50,
            maxIdleTimeMS=45000,
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            retryWrites=True,
            retryReads=True,
            appname="JARVIS-Agent"
        )
        # Verify connection immediately using ping
        _client.admin.command('ping')
        _db = _client[settings.MONGODB_DATABASE]
        logger.info(f"Successfully connected and verified MongoDB database: {settings.MONGODB_DATABASE}")
        
        # Initialize indexes
        create_indexes(_db)
        return _client
    except OperationFailure as e:
        logger.error(f"MongoDB Authentication/Operation Failure on {masked}: {e.details if hasattr(e, 'details') else str(e)}")
        raise
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"MongoDB Connection Failure on {masked}: {str(e)}")
        raise

def close_mongo_client():
    """Closes MongoClient during application shutdown."""
    global _client, _db
    if _client is not None:
        logger.info("Closing MongoDB connection pool...")
        _client.close()
        _client = None
        _db = None

def get_database() -> Database:
    """Returns the active MongoDB database handle or raises 503 if unavailable."""
    global _client, _db
    if _db is not None:
        return _db
    
    try:
        init_mongo_client()
        return _db
    except Exception as e:
        logger.error(f"Database access attempted while MongoDB is unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database service is currently unavailable. Please verify MongoDB Atlas connection."
        )

def get_db():
    """Dependency provider for FastAPI route endpoints."""
    return get_database()

def create_indexes(db: Database):
    """Ensures performance and constraint indexes on collections."""
    try:
        # Users indexes
        db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")
        
        # Tasks indexes
        db.tasks.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="idx_tasks_user_created")
        db.tasks.create_index([("status", ASCENDING)], name="idx_tasks_status")
        
        # Notes indexes
        db.notes.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="idx_notes_user_created")
        
        # Agent Runs indexes
        db.agent_runs.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="idx_agent_runs_user_created")
        
        # Agent Steps indexes
        db.agent_steps.create_index([("agent_run_id", ASCENDING), ("step_order", ASCENDING)], name="idx_agent_steps_run_order")
        db.agent_steps.create_index([("idempotency_key", ASCENDING)], sparse=True, name="idx_agent_steps_idempotency")
        
        # Execution logs indexes
        db.execution_logs.create_index([("agent_run_id", ASCENDING), ("timestamp", DESCENDING)], name="idx_exec_logs_run_time")
        db.execution_logs.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)], name="idx_exec_logs_user_time")
        
        logger.info("MongoDB collections and indexes ensured successfully.")
    except Exception as e:
        logger.warning(f"Warning creating MongoDB indexes: {e}")
