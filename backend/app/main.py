from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.database.mongodb import initialize_collections, close_connections
from app.api.auth import auth_router
from app.api.organizations import org_router
from app.api.repositories import repo_router
from app.api.chat import chat_router
from app.api.search import search_router
from app.api.code import code_router
from app.api.documentation import doc_router
from app.api.usage import usage_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB collections with WiredTiger snappy compression + indexes
    initialize_collections()
    print(
        f"MongoDB connected — database: '{settings.MONGODB_DB_NAME}' "
        "(WiredTiger snappy compression active)"
    )
    yield
    # Graceful shutdown
    close_connections()
    print("MongoDB connections closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Codev — AI Developer Knowledge Platform & Codebase Intelligence API",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(org_router, prefix=settings.API_V1_STR)
app.include_router(repo_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)
app.include_router(code_router, prefix=settings.API_V1_STR)
app.include_router(doc_router, prefix=settings.API_V1_STR)
app.include_router(usage_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "database": "MongoDB (WiredTiger snappy)",
        "docs_url": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "database": settings.MONGODB_DB_NAME,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
