import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Codev"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "codev_super_secret_jwt_signing_key_change_in_production_987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Legacy relational DB (kept for optional pgvector use)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./codev.db"
    )

    # MongoDB (primary store)
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/codev_db")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "codev_db")
    
    # Vector Database / Indexing
    VECTOR_STORE_BACKEND: str = os.getenv("VECTOR_STORE_BACKEND", "auto") # "pgvector", "memory", "auto"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_DIMENSION: int = 1536
    
    # AI Providers
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    DEFAULT_LLM_MODEL: str = os.getenv("DEFAULT_LLM_MODEL", "gpt-4o-mini")
    
    # GitHub Integration
    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID", None)
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET", None)
    GITHUB_REDIRECT_URI: Optional[str] = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:5173/auth/github/callback")
    
    # File storage for cloned/ingested repositories
    REPO_CACHE_DIR: str = os.getenv("REPO_CACHE_DIR", "./storage/repos")
    MAX_FILE_SIZE_KB: int = 500  # Max individual file size to index
    MAX_REPO_FILES: int = 1000  # Max files per repo for MVP
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
