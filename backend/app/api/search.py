from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.database.mongodb import get_db
from app.models.mongo_models import Organization, Repository, UsageEvent
from app.schemas.schemas import CodeSearchRequest, SearchResponse, SearchResultItem
from app.auth.dependencies import get_current_user, get_current_organization
from app.embeddings.service import embedding_service
from app.vectorstore.store import VectorStore

search_router = APIRouter(prefix="/search", tags=["Semantic Code Search"])


@search_router.post("", response_model=SearchResponse)
async def semantic_code_search(
    payload: CodeSearchRequest,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """
    Executes dedicated semantic code search across indexed repository code chunks.
    Returns matched file paths, symbols, line numbers, snippets, and relevance scores.
    """
    repo = db[Repository.COLLECTION].find_one(
        {"_id": payload.repository_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    query_emb = await embedding_service.get_embedding(payload.query)

    vector_store = VectorStore(db)
    chunks = vector_store.search_similar_chunks(
        repository_id=repo["_id"],
        query_embedding=query_emb,
        query_text=payload.query,
        top_k=payload.limit or 15,
        language=payload.language,
        path_filter=payload.path_filter,
    )

    results = [
        SearchResultItem(
            chunk_id=c["chunk_id"],
            file_path=c["file_path"],
            symbol_name=c.get("symbol_name"),
            symbol_type=c.get("symbol_type"),
            language=c.get("language", "Code"),
            start_line=c["start_line"],
            end_line=c["end_line"],
            code_snippet=c["chunk_content"],
            relevance_score=c["score"],
        )
        for c in chunks
    ]

    return SearchResponse(
        query=payload.query,
        total_results=len(results),
        results=results,
    )
