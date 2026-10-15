import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "JARVIS — Personal AI Agent"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = "jarvis-super-secret-production-grade-key-2026-chaos"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # MongoDB Atlas Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "jarvis_db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # AI / LLM Integration (optional key for Gemini; deterministic high-precision planner used if not set)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
