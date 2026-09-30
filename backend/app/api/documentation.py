from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List
from datetime import datetime

from app.database.mongodb import get_db
from app.models.mongo_models import (
    Organization, Repository, GeneratedDocument, UsageEvent, User
)
from app.schemas.schemas import DocGenerateRequest, DocOut
from app.auth.dependencies import get_current_user, get_current_organization
from app.rag.engine import RAGEngine

doc_router = APIRouter(prefix="/documentation", tags=["Documentation Generator"])


@doc_router.post("/generate", response_model=DocOut)
async def generate_documentation(
    payload: DocGenerateRequest,
    current_user: dict = Depends(get_current_user),
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """
    Generates developer documentation (README, API Docs, Architecture Guide, Setup, Onboarding).
    Persists document version and returns formatted markdown.
    """
    repo = db[Repository.COLLECTION].find_one(
        {"_id": payload.repository_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    engine = RAGEngine(db)
    generated = await engine.generate_documentation(
        repository_id=repo["_id"],
        doc_type=payload.doc_type,
        custom_instructions=payload.custom_instructions,
    )

    # Check for existing document to increment version
    existing_doc = db[GeneratedDocument.COLLECTION].find_one(
        {"repository_id": repo["_id"], "doc_type": payload.doc_type}
    )

    now = datetime.utcnow()
    if existing_doc:
        db[GeneratedDocument.COLLECTION].update_one(
            {"_id": existing_doc["_id"]},
            {
                "$set": {
                    "title": generated["title"],
                    "content": GeneratedDocument.new(
                        organization_id=current_org["_id"],
                        repository_id=repo["_id"],
                        doc_type=payload.doc_type,
                        title=generated["title"],
                        content=generated["content"],
                    )["content"],  # compressed
                    "version": existing_doc.get("version", 1) + 1,
                    "updated_at": now,
                }
            },
        )
        saved_doc = db[GeneratedDocument.COLLECTION].find_one({"_id": existing_doc["_id"]})
    else:
        new_doc = GeneratedDocument.new(
            organization_id=current_org["_id"],
            repository_id=repo["_id"],
            doc_type=payload.doc_type,
            title=generated["title"],
            content=generated["content"],
            version=1,
        )
        db[GeneratedDocument.COLLECTION].insert_one(new_doc)
        saved_doc = new_doc

    usage = UsageEvent.new(
        organization_id=current_org["_id"],
        user_id=current_user["_id"],
        event_type="generate_doc",
        event_metadata={"repo_id": repo["_id"], "doc_type": payload.doc_type},
    )
    db[UsageEvent.COLLECTION].insert_one(usage)

    return DocOut(
        id=saved_doc["_id"],
        organization_id=saved_doc["organization_id"],
        repository_id=saved_doc["repository_id"],
        doc_type=saved_doc["doc_type"],
        title=saved_doc["title"],
        content=GeneratedDocument.get_content(saved_doc),
        version=saved_doc.get("version", 1),
        created_at=saved_doc["created_at"],
        updated_at=saved_doc.get("updated_at", saved_doc["created_at"]),
    )


@doc_router.get("/{repository_id}", response_model=List[DocOut])
def list_repository_documents(
    repository_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Lists all saved generated documents for a repository."""
    docs = list(
        db[GeneratedDocument.COLLECTION].find(
            {"repository_id": repository_id, "organization_id": current_org["_id"]}
        )
    )
    return [
        DocOut(
            id=d["_id"],
            organization_id=d["organization_id"],
            repository_id=d["repository_id"],
            doc_type=d["doc_type"],
            title=d["title"],
            content=GeneratedDocument.get_content(d),
            version=d.get("version", 1),
            created_at=d["created_at"],
            updated_at=d.get("updated_at", d["created_at"]),
        )
        for d in docs
    ]
