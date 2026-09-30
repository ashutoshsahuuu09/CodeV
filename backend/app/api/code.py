from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.database.mongodb import get_db
from app.models.mongo_models import Organization, Repository, UsageEvent, User
from app.schemas.schemas import CodeExplainRequest, CodeExplanationOut
from app.auth.dependencies import get_current_user, get_current_organization
from app.rag.engine import RAGEngine

code_router = APIRouter(prefix="/code", tags=["Code Explainer"])


@code_router.post("/explain", response_model=CodeExplanationOut)
async def explain_code_block(
    payload: CodeExplainRequest,
    current_user: dict = Depends(get_current_user),
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """
    Analyzes a selected code block or symbol in a file and returns structured explanations.
    """
    repo = db[Repository.COLLECTION].find_one(
        {"_id": payload.repository_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    engine = RAGEngine(db)
    explanation = await engine.explain_code(
        repository_id=repo["_id"],
        file_path=payload.file_path,
        code_snippet=payload.code_snippet,
        symbol_name=payload.symbol_name,
        start_line=payload.start_line,
        end_line=payload.end_line,
    )

    usage = UsageEvent.new(
        organization_id=current_org["_id"],
        user_id=current_user["_id"],
        event_type="explain_code",
        event_metadata={"repo_id": repo["_id"], "file_path": payload.file_path},
    )
    db[UsageEvent.COLLECTION].insert_one(usage)

    return CodeExplanationOut(
        file_path=explanation["file_path"],
        symbol_name=explanation.get("symbol_name"),
        summary=explanation["summary"],
        inputs=explanation["inputs"],
        outputs=explanation["outputs"],
        dependencies=explanation["dependencies"],
        important_logic=explanation["important_logic"],
        edge_cases=explanation["edge_cases"],
        potential_issues=explanation["potential_issues"],
        full_markdown=explanation["full_markdown"],
    )
