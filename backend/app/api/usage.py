from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.database.mongodb import get_db
from app.models.mongo_models import (
    Organization, Repository, RepositoryFile, CodeChunk, Conversation, Message,
    GeneratedDocument, IndexingJob, UsageEvent
)
from app.schemas.schemas import UsageStatsOut
from app.auth.dependencies import get_current_organization

usage_router = APIRouter(prefix="/usage", tags=["Usage & Dashboard Stats"])


@usage_router.get("/stats", response_model=UsageStatsOut)
def get_dashboard_usage_stats(
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Aggregates metrics for dashboard cards and activity feeds."""
    org_id = current_org["_id"]

    total_repos = db[Repository.COLLECTION].count_documents({"organization_id": org_id})

    repo_ids = [
        r["_id"]
        for r in db[Repository.COLLECTION].find({"organization_id": org_id}, {"_id": 1})
    ]

    total_files = 0
    total_chunks = 0
    if repo_ids:
        total_files = db[RepositoryFile.COLLECTION].count_documents(
            {"repository_id": {"$in": repo_ids}}
        )
        total_chunks = db[CodeChunk.COLLECTION].count_documents(
            {"repository_id": {"$in": repo_ids}}
        )

    total_queries = db[UsageEvent.COLLECTION].count_documents(
        {"organization_id": org_id, "event_type": "chat_query"}
    )

    total_docs = db[GeneratedDocument.COLLECTION].count_documents({"organization_id": org_id})

    # Recent indexing jobs
    recent_jobs = []
    if repo_ids:
        jobs = list(
            db[IndexingJob.COLLECTION]
            .find({"repository_id": {"$in": repo_ids}})
            .sort("started_at", -1)
            .limit(5)
        )
        for j in jobs:
            repo = db[Repository.COLLECTION].find_one({"_id": j["repository_id"]}, {"name": 1})
            repo_name = repo["name"] if repo else "Unknown"
            recent_jobs.append({
                "job_id": j["_id"],
                "repository_name": repo_name,
                "status": j["status"],
                "progress_pct": j["progress_pct"],
                "current_step": j["current_step"],
                "total_files": j["total_files"],
                "started_at": j["started_at"].isoformat() if j.get("started_at") else None,
            })

    # Recent activity
    recent_events = list(
        db[UsageEvent.COLLECTION]
        .find({"organization_id": org_id})
        .sort("created_at", -1)
        .limit(8)
    )
    activity = [
        {
            "id": e["_id"],
            "event_type": e["event_type"],
            "tokens_used": e.get("tokens_used", 0),
            "latency_ms": e.get("latency_ms", 0),
            "created_at": e["created_at"].isoformat() if e.get("created_at") else None,
            "metadata": e.get("event_metadata", {}),
        }
        for e in recent_events
    ]

    return UsageStatsOut(
        total_repositories=total_repos,
        total_indexed_files=total_files,
        total_code_chunks=total_chunks,
        total_queries=total_queries,
        total_documents=total_docs,
        recent_indexing_jobs=recent_jobs,
        recent_activity=activity,
    )
