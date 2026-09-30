from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List, Optional
from datetime import datetime

from app.database.mongodb import get_db
from app.models.mongo_models import (
    User, Organization, Repository, Conversation, Message, UsageEvent
)
from app.schemas.schemas import (
    ChatQueryRequest, MessageOut, ConversationOut, ConversationDetailOut, SourceCitation
)
from app.auth.dependencies import get_current_user, get_current_organization
from app.rag.engine import RAGEngine

chat_router = APIRouter(prefix="/chat", tags=["AI Chat"])


def _msg_sources_to_out(sources: list) -> List[SourceCitation]:
    out = []
    for s in sources:
        out.append(
            SourceCitation(
                file_path=s.get("file_path", ""),
                start_line=s.get("start_line", 1),
                end_line=s.get("end_line", 1),
                symbol=s.get("symbol"),
                symbol_type=s.get("symbol_type"),
                language=s.get("language"),
                relevance_score=s.get("relevance_score"),
                snippet=s.get("snippet"),
            )
        )
    return out


@chat_router.post("", response_model=MessageOut)
async def query_repository_chat(
    payload: ChatQueryRequest,
    current_user: dict = Depends(get_current_user),
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """
    Submits a natural language developer question about a repository codebase.
    Executes hybrid RAG retrieval, runs safety checks, and returns source-backed answer.
    """
    repo = db[Repository.COLLECTION].find_one(
        {"_id": payload.repository_id, "organization_id": current_org["_id"]}
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found in your organization")

    # Get or create conversation
    conversation = None
    if payload.conversation_id:
        conversation = db[Conversation.COLLECTION].find_one(
            {"_id": payload.conversation_id, "organization_id": current_org["_id"]}
        )

    if not conversation:
        title = payload.message[:60] + ("..." if len(payload.message) > 60 else "")
        conversation = Conversation.new(
            organization_id=current_org["_id"],
            repository_id=repo["_id"],
            user_id=current_user["_id"],
            title=title,
        )
        db[Conversation.COLLECTION].insert_one(conversation)

    # Store User message (compressed)
    user_msg = Message.new(
        conversation_id=conversation["_id"],
        role="user",
        content=payload.message,
        sources=[],
    )
    db[Message.COLLECTION].insert_one(user_msg)

    # Fetch prior history (decompress for LLM context)
    past_messages = list(
        db[Message.COLLECTION]
        .find({"conversation_id": conversation["_id"]})
        .sort("created_at", 1)
    )
    conv_history = [
        {"role": m["role"], "content": Message.get_content(m)} for m in past_messages
    ]

    # Run RAG Engine
    engine = RAGEngine(db)
    rag_result = await engine.answer_question(
        repository_id=repo["_id"],
        question=payload.message,
        conversation_history=conv_history,
    )

    # Save Assistant response (compressed)
    assistant_msg = Message.new(
        conversation_id=conversation["_id"],
        role="assistant",
        content=rag_result["answer"],
        sources=rag_result["sources"],
        latency_ms=rag_result.get("latency_ms", 0),
    )
    db[Message.COLLECTION].insert_one(assistant_msg)

    # Update conversation updated_at
    db[Conversation.COLLECTION].update_one(
        {"_id": conversation["_id"]}, {"$set": {"updated_at": datetime.utcnow()}}
    )

    # Record usage event
    usage = UsageEvent.new(
        organization_id=current_org["_id"],
        user_id=current_user["_id"],
        event_type="chat_query",
        tokens_used=len(payload.message.split()) + len(rag_result["answer"].split()),
        latency_ms=rag_result.get("latency_ms", 0),
        event_metadata={"repo_id": repo["_id"], "conversation_id": conversation["_id"]},
    )
    db[UsageEvent.COLLECTION].insert_one(usage)

    sources_out = _msg_sources_to_out(rag_result["sources"])
    return MessageOut(
        id=assistant_msg["_id"],
        role=assistant_msg["role"],
        content=Message.get_content(assistant_msg),
        sources=sources_out,
        created_at=assistant_msg["created_at"],
    )


@chat_router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    repository_id: Optional[str] = None,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Lists conversations for an organization and optional repository filter."""
    query_filter = {"organization_id": current_org["_id"]}
    if repository_id:
        query_filter["repository_id"] = repository_id

    conversations = list(
        db[Conversation.COLLECTION].find(query_filter).sort("updated_at", -1)
    )
    results = []
    for c in conversations:
        last_msg = db[Message.COLLECTION].find_one(
            {"conversation_id": c["_id"]}, sort=[("created_at", -1)]
        )
        preview = None
        if last_msg:
            content = Message.get_content(last_msg)
            preview = content[:80] + "..." if len(content) > 80 else content
        results.append(
            ConversationOut(
                id=c["_id"],
                repository_id=c["repository_id"],
                title=c.get("title", "New Conversation"),
                created_at=c["created_at"],
                updated_at=c.get("updated_at", c["created_at"]),
                last_message_preview=preview,
            )
        )
    return results


@chat_router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
def get_conversation_detail(
    conversation_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Retrieves all messages and source citations for a conversation."""
    conv = db[Conversation.COLLECTION].find_one(
        {"_id": conversation_id, "organization_id": current_org["_id"]}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = list(
        db[Message.COLLECTION]
        .find({"conversation_id": conv["_id"]})
        .sort("created_at", 1)
    )

    formatted_msgs = []
    for m in messages:
        sources_list = _msg_sources_to_out(m.get("sources", []))
        formatted_msgs.append(
            MessageOut(
                id=m["_id"],
                role=m["role"],
                content=Message.get_content(m),
                sources=sources_list,
                created_at=m["created_at"],
            )
        )

    return ConversationDetailOut(
        id=conv["_id"],
        repository_id=conv["repository_id"],
        title=conv.get("title", "New Conversation"),
        created_at=conv["created_at"],
        updated_at=conv.get("updated_at", conv["created_at"]),
        messages=formatted_msgs,
    )


@chat_router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_org: dict = Depends(get_current_organization),
    db: Database = Depends(get_db),
):
    """Deletes a chat conversation thread."""
    conv = db[Conversation.COLLECTION].find_one(
        {"_id": conversation_id, "organization_id": current_org["_id"]}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db[Message.COLLECTION].delete_many({"conversation_id": conversation_id})
    db[Conversation.COLLECTION].delete_one({"_id": conversation_id})
    return {"message": "Conversation deleted successfully"}
