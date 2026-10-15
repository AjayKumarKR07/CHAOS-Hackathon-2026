import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_mongo_client, close_mongo_client, get_database, mask_mongo_uri
from app.api.auth import router as auth_router
from app.api.agent import router as agent_router
from app.api.tasks import router as tasks_router
from app.api.notes import router as notes_router
from app.api.tools import router as tools_router

logger = logging.getLogger("jarvis.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection and verify with ping
    try:
        logger.info("Initializing MongoDB Atlas connection...")
        init_mongo_client()
        logger.info("MongoDB Atlas connected and collections ready.")
    except Exception as e:
        logger.error(f"Error during MongoDB startup initialization: {e}")
    yield
    # Cleanup on shutdown
    close_mongo_client()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="JARVIS: Personal AI Agent with MongoDB Atlas, Multi-Step Execution, Tool Verification, and Failure Recovery",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(agent_router, prefix=settings.API_V1_PREFIX)
app.include_router(tasks_router, prefix=settings.API_V1_PREFIX)
app.include_router(notes_router, prefix=settings.API_V1_PREFIX)
app.include_router(tools_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "MongoDB Atlas",
        "status": "online",
        "documentation": "/docs"
    }

from datetime import datetime, timezone

@app.get("/api/health")
def health_check():
    db_status = "unavailable"
    db_name = settings.MONGODB_DATABASE
    error_detail = None
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db = get_database()
        ping_res = db.client.admin.command('ping')
        if ping_res.get("ok") == 1:
            db_status = "connected"
    except Exception as e:
        safe_msg = str(e)
        if "@" in safe_msg:
            safe_msg = mask_mongo_uri(safe_msg)
        error_detail = safe_msg[:120]
        db_status = "unavailable"

    cluster_host = "unconfigured"
    if "@" in settings.MONGODB_URI:
        cluster_host = settings.MONGODB_URI.split("@")[-1].split("/")[0].split("?")[0]

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": now_iso,
        "database": {
            "engine": "MongoDB Atlas",
            "provider": "MongoDB Atlas",
            "name": db_name,
            "status": db_status,
            "cluster": cluster_host,
            "error_detail": error_detail,
            "checked_at": now_iso
        }
    }
