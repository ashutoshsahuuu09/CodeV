import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pymongo.database import Database
from typing import List, Optional
from datetime import datetime

from app.database.mongodb import get_db
from app.models.mongo_models import (
    User, Organization, Repository, RepositoryFile, CodeChunk, IndexingJob, UsageEvent
)
from app.schemas.schemas import (
    RepoOut, RepoDetailOut, RepoConnectUrl, RepoIndexRequest,
    IndexingStatusOut, FileTreeItem, FileContentOut
)
from app.auth.dependencies import get_current_user, get_current_organization
from app.ingestion.pipeline import run_indexing_pipeline
from app.github.client import SAMPLE_REPOSITORIES

repo_router = APIRouter(prefix="/repositories", tags=["Repositories"])


def _repo_to_out(repo: dict) -> RepoOut:
    return RepoOut(
        id=repo["_id"],
        organization_id=repo["organization_id"],
        name=repo["name"],
        full_name=repo["full_name"],
        description=repo.get("description"),
        default_branch=repo.get("default_branch", "main"),
        is_private=repo.get("is_private", False),
        primary_language=repo.get("primary_language", "Unknown"),
        html_url=repo.get("html_url"),
        indexing_status=repo.get("indexing_status", "pending"),
        indexing_progress=repo.get("indexing_progress", 0),
        last_indexed_at=repo.get("last_indexed_at"),
        file_count=repo.get("file_count", 0),
        chunk_count=repo.get("chunk_count", 0),
        created_at=repo["created_at"],
    )


@repo_router.get("", response_model=List[RepoOut])
def list_repositories(
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Lists all connected repositories for the current organization."""
    repos = list(
        db[Repository.COLLECTION]
        .find({"organization_id": current_org["_id"]})
        .sort("created_at", -1)
    )
    return [_repo_to_out(r) for r in repos]


@repo_router.post("/connect", response_model=RepoOut, status_code=status.HTTP_201_CREATED)
def connect_repository(
    payload: RepoConnectUrl,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """
    Connects a GitHub repository to the organization and enqueues indexing.
    """
    repo_url = payload.repo_url.strip()
    name = repo_url.split("/")[-1].replace(".git", "") or "sample-repository"
    full_name = (
        "/".join(repo_url.split("/")[-2:]).replace(".git", "")
        if "/" in repo_url
        else f"org/{name}"
    )

    primary_lang = "Python"
    description = f"Connected repository for {full_name}"
    for sample in SAMPLE_REPOSITORIES:
        if sample["name"].lower() in repo_url.lower() or sample["full_name"].lower() in repo_url.lower():
            name = sample["name"]
            full_name = sample["full_name"]
            description = sample["description"]
            primary_lang = sample["primary_language"]
            break

    repo = Repository.new(
        organization_id=current_org["_id"],
        name=name,
        full_name=full_name,
        description=description,
        default_branch=payload.branch or "main",
        primary_language=primary_lang,
        html_url=repo_url if repo_url.startswith("http") else f"https://github.com/{full_name}",
        clone_url=repo_url,
    )
    db[Repository.COLLECTION].insert_one(repo)

    job = IndexingJob.new(
        repository_id=repo["_id"],
        status="queued",
        current_step="Queued for indexing...",
    )
    db[IndexingJob.COLLECTION].insert_one(job)

    background_tasks.add_task(
        run_indexing_pipeline,
        db=db,
        repository_id=repo["_id"],
        job_id=job["_id"],
    )

    return _repo_to_out(repo)


@repo_router.get("/samples")
def get_sample_repositories():
    """Returns pre-configured sample repositories for 1-click testing."""
    return [
        {
            "name": s["name"],
            "full_name": s["full_name"],
            "description": s["description"],
            "primary_language": s["primary_language"],
            "html_url": s["html_url"],
            "file_count": len(s["files"]),
        }
        for s in SAMPLE_REPOSITORIES
    ]


@repo_router.get("/{repo_id}", response_model=RepoDetailOut)
def get_repository_details(
    repo_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Fetches comprehensive details for a repository including files and architecture overview."""
    repo = db[Repository.COLLECTION].find_one(
        {"_id": repo_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    files = list(db[RepositoryFile.COLLECTION].find({"repository_id": repo["_id"]}))
    file_items = [
        FileTreeItem(
            id=f["_id"],
            file_path=f["file_path"],
            file_name=f["file_name"],
            language=f["language"],
            size_bytes=f.get("size_bytes", 0),
            line_count=f.get("line_count", 0),
            content_summary=f.get("content_summary"),
        )
        for f in files
    ]

    return RepoDetailOut(
        id=repo["_id"],
        organization_id=repo["organization_id"],
        name=repo["name"],
        full_name=repo["full_name"],
        description=repo.get("description"),
        default_branch=repo.get("default_branch", "main"),
        is_private=repo.get("is_private", False),
        primary_language=repo.get("primary_language", "Unknown"),
        html_url=repo.get("html_url"),
        indexing_status=repo.get("indexing_status", "pending"),
        indexing_progress=repo.get("indexing_progress", 0),
        last_indexed_at=repo.get("last_indexed_at"),
        file_count=repo.get("file_count", 0),
        chunk_count=repo.get("chunk_count", 0),
        created_at=repo["created_at"],
        repo_metadata=repo.get("repo_metadata") or {},
        architecture_overview=repo.get("architecture_overview"),
        files=file_items,
    )


@repo_router.post("/{repo_id}/index", response_model=IndexingStatusOut)
def trigger_repository_index(
    repo_id: str,
    payload: RepoIndexRequest,
    background_tasks: BackgroundTasks,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Manually triggers or forces re-indexing of a repository."""
    repo = db[Repository.COLLECTION].find_one(
        {"_id": repo_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    job = IndexingJob.new(
        repository_id=repo["_id"],
        status="queued",
        current_step="Queued for re-indexing...",
    )
    db[IndexingJob.COLLECTION].insert_one(job)
    db[Repository.COLLECTION].update_one(
        {"_id": repo["_id"]},
        {"$set": {"indexing_status": "indexing", "indexing_progress": 0}},
    )

    background_tasks.add_task(
        run_indexing_pipeline,
        db=db,
        repository_id=repo["_id"],
        job_id=job["_id"],
    )

    return IndexingStatusOut(
        job_id=job["_id"],
        repository_id=repo["_id"],
        status=job["status"],
        progress_pct=job["progress_pct"],
        current_step=job["current_step"],
        total_files=job["total_files"],
        processed_files=job["processed_files"],
        total_chunks=job["total_chunks"],
    )


@repo_router.get("/{repo_id}/status", response_model=IndexingStatusOut)
def get_indexing_status(
    repo_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Polls live indexing progress for a repository."""
    repo = db[Repository.COLLECTION].find_one(
        {"_id": repo_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    latest_job = db[IndexingJob.COLLECTION].find_one(
        {"repository_id": repo["_id"]}, sort=[("started_at", -1)]
    )
    if latest_job:
        return IndexingStatusOut(
            job_id=latest_job["_id"],
            repository_id=repo["_id"],
            status=latest_job["status"],
            progress_pct=latest_job["progress_pct"],
            current_step=latest_job["current_step"],
            total_files=latest_job["total_files"],
            processed_files=latest_job["processed_files"],
            total_chunks=latest_job["total_chunks"],
            error_message=latest_job.get("error_message"),
        )

    return IndexingStatusOut(
        repository_id=repo["_id"],
        status=repo.get("indexing_status", "pending"),
        progress_pct=repo.get("indexing_progress", 0),
        current_step="Completed" if repo.get("indexing_status") == "completed" else "Idle",
        total_files=repo.get("file_count", 0),
        processed_files=repo.get("file_count", 0),
        total_chunks=repo.get("chunk_count", 0),
    )


@repo_router.get("/{repo_id}/files", response_model=List[FileTreeItem])
def list_repository_files(
    repo_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Returns flat file list for navigation in Code Viewer and Explorer."""
    repo = db[Repository.COLLECTION].find_one(
        {"_id": repo_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    files = list(db[RepositoryFile.COLLECTION].find({"repository_id": repo["_id"]}))
    return [
        FileTreeItem(
            id=f["_id"],
            file_path=f["file_path"],
            file_name=f["file_name"],
            language=f["language"],
            size_bytes=f.get("size_bytes", 0),
            line_count=f.get("line_count", 0),
            content_summary=f.get("content_summary"),
        )
        for f in files
    ]


@repo_router.get("/{repo_id}/files/content", response_model=FileContentOut)
def get_file_content_by_path(
    repo_id: str,
    path: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Retrieves raw content of a specific file for the Code Viewer."""
    repo = db[Repository.COLLECTION].find_one(
        {"_id": repo_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    clean_path = path.strip().replace("\\", "/")
    f = db[RepositoryFile.COLLECTION].find_one(
        {"repository_id": repo["_id"], "file_path": clean_path}
    )
    if not f:
        raise HTTPException(status_code=404, detail=f"File '{clean_path}' not found in repository")

    from app.models.mongo_models import RepositoryFile as RF
    return FileContentOut(
        id=f["_id"],
        file_path=f["file_path"],
        file_name=f["file_name"],
        language=f["language"],
        raw_content=RF.get_raw_content(f) or "",
        line_count=f.get("line_count", 0),
        size_bytes=f.get("size_bytes", 0),
    )


@repo_router.delete("/{repo_id}")
def delete_repository(
    repo_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Deletes a repository and all indexed chunks."""
    repo = db[Repository.COLLECTION].find_one(
        {"_id": repo_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Cascade delete
    db[CodeChunk.COLLECTION].delete_many({"repository_id": repo_id})
    db[RepositoryFile.COLLECTION].delete_many({"repository_id": repo_id})
    db[IndexingJob.COLLECTION].delete_many({"repository_id": repo_id})
    db[Repository.COLLECTION].delete_one({"_id": repo_id})
    return {"message": "Repository deleted successfully"}
