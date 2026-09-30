"""
MongoDB Document Models — Codev
================================
Pure Python dataclasses used as typed document factories.
No ORM — documents are plain dicts stored in MongoDB.

Compression is handled transparently by WiredTiger snappy at the storage layer.
Application-level zlib compression is applied to large text fields:
  - raw_content  (RepositoryFile)
  - chunk_content (CodeChunk)
  - content       (GeneratedDocument, Message)
to further reduce in-memory and on-wire size.
"""

import uuid
import zlib
import base64
from datetime import datetime
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def new_id() -> str:
    """Generate a UUID4 string as the document _id."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.utcnow()


def compress_text(text: str) -> str:
    """zlib-compress + base64-encode a string. Returns the encoded string."""
    if not text:
        return text
    compressed = zlib.compress(text.encode("utf-8"), level=6)
    return base64.b64encode(compressed).decode("ascii")


def decompress_text(encoded: str) -> str:
    """Reverse of compress_text. Handles already-uncompressed legacy values gracefully."""
    if not encoded:
        return encoded
    try:
        raw_bytes = base64.b64decode(encoded)
        return zlib.decompress(raw_bytes).decode("utf-8")
    except Exception:
        # Not compressed (e.g., freshly inserted plain text) — return as-is
        return encoded


# ---------------------------------------------------------------------------
# Document factories — return plain dicts ready for pymongo insert_one
# ---------------------------------------------------------------------------

class Organization:
    COLLECTION = "organizations"

    @staticmethod
    def new(
        name: str,
        slug: str,
        description: Optional[str] = None,
        plan: str = "starter",
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "name": name,
            "slug": slug,
            "description": description,
            "plan": plan,
            "created_at": now,
            "updated_at": now,
        }


class User:
    COLLECTION = "users"

    @staticmethod
    def new(
        email: str,
        full_name: str,
        hashed_password: str,
        avatar_url: Optional[str] = None,
        is_active: bool = True,
        is_superuser: bool = False,
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "avatar_url": avatar_url,
            "is_active": is_active,
            "is_superuser": is_superuser,
            "created_at": now,
            "updated_at": now,
        }


class OrganizationMember:
    COLLECTION = "organization_members"

    @staticmethod
    def new(
        organization_id: str,
        user_id: str,
        role: str = "member",
    ) -> Dict[str, Any]:
        return {
            "_id": new_id(),
            "organization_id": organization_id,
            "user_id": user_id,
            "role": role,
            "created_at": utcnow(),
        }


class GitHubConnection:
    COLLECTION = "github_connections"

    @staticmethod
    def new(
        user_id: str,
        github_username: str,
        access_token_enc: str,
        github_user_id: Optional[str] = None,
        token_type: str = "bearer",
        scope: str = "repo,read:user",
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "user_id": user_id,
            "github_username": github_username,
            "github_user_id": github_user_id,
            "access_token_enc": access_token_enc,
            "token_type": token_type,
            "scope": scope,
            "created_at": now,
            "updated_at": now,
        }


class Repository:
    COLLECTION = "repositories"

    @staticmethod
    def new(
        organization_id: str,
        name: str,
        full_name: str,
        description: Optional[str] = None,
        default_branch: str = "main",
        is_private: bool = False,
        primary_language: str = "Unknown",
        html_url: Optional[str] = None,
        clone_url: Optional[str] = None,
        last_commit_sha: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "organization_id": organization_id,
            "name": name,
            "full_name": full_name,
            "description": description,
            "default_branch": default_branch,
            "is_private": is_private,
            "primary_language": primary_language,
            "html_url": html_url,
            "clone_url": clone_url,
            "last_commit_sha": last_commit_sha,
            "indexing_status": "pending",
            "indexing_progress": 0,
            "last_indexed_at": None,
            "file_count": 0,
            "chunk_count": 0,
            "repo_metadata": {},
            "architecture_overview": None,
            "created_at": now,
            "updated_at": now,
        }


class RepositoryFile:
    COLLECTION = "repository_files"

    @staticmethod
    def new(
        repository_id: str,
        file_path: str,
        file_name: str,
        language: str,
        size_bytes: int = 0,
        line_count: int = 0,
        sha256_hash: Optional[str] = None,
        raw_content: Optional[str] = None,
        content_summary: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "repository_id": repository_id,
            "file_path": file_path,
            "file_name": file_name,
            "language": language,
            "size_bytes": size_bytes,
            "line_count": line_count,
            "sha256_hash": sha256_hash,
            # Compress large text fields
            "raw_content": compress_text(raw_content) if raw_content else None,
            "content_summary": content_summary,
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def get_raw_content(doc: Dict[str, Any]) -> Optional[str]:
        """Decompress raw_content field for reading."""
        return decompress_text(doc["raw_content"]) if doc.get("raw_content") else None


class CodeChunk:
    COLLECTION = "code_chunks"

    @staticmethod
    def new(
        repository_id: str,
        file_id: str,
        file_path: str,
        language: str,
        start_line: int,
        end_line: int,
        chunk_content: str,
        symbol_name: Optional[str] = None,
        symbol_type: str = "block",
        chunk_tokens: int = 0,
        embedding_json: Optional[List[float]] = None,
        commit_sha: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "_id": new_id(),
            "repository_id": repository_id,
            "file_id": file_id,
            "file_path": file_path,
            "language": language,
            "symbol_name": symbol_name,
            "symbol_type": symbol_type,
            "start_line": start_line,
            "end_line": end_line,
            # Compress chunk content (often large code blocks)
            "chunk_content": compress_text(chunk_content),
            "chunk_tokens": chunk_tokens,
            "embedding_json": embedding_json,  # float list — kept uncompressed for fast cosine math
            "commit_sha": commit_sha,
            "created_at": utcnow(),
        }

    @staticmethod
    def get_chunk_content(doc: Dict[str, Any]) -> str:
        """Decompress chunk_content field for reading."""
        return decompress_text(doc["chunk_content"]) if doc.get("chunk_content") else ""


class Conversation:
    COLLECTION = "conversations"

    @staticmethod
    def new(
        organization_id: str,
        repository_id: str,
        user_id: str,
        title: str = "New Conversation",
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "organization_id": organization_id,
            "repository_id": repository_id,
            "user_id": user_id,
            "title": title,
            "created_at": now,
            "updated_at": now,
        }


class Message:
    COLLECTION = "messages"

    @staticmethod
    def new(
        conversation_id: str,
        role: str,
        content: str,
        sources: Optional[List[Dict]] = None,
        token_count: int = 0,
        latency_ms: int = 0,
    ) -> Dict[str, Any]:
        return {
            "_id": new_id(),
            "conversation_id": conversation_id,
            "role": role,
            # Compress message content (can be long AI responses)
            "content": compress_text(content),
            "sources": sources or [],
            "token_count": token_count,
            "latency_ms": latency_ms,
            "created_at": utcnow(),
        }

    @staticmethod
    def get_content(doc: Dict[str, Any]) -> str:
        """Decompress content field for reading."""
        return decompress_text(doc["content"]) if doc.get("content") else ""


class GeneratedDocument:
    COLLECTION = "generated_documents"

    @staticmethod
    def new(
        organization_id: str,
        repository_id: str,
        doc_type: str,
        title: str,
        content: str,
        version: int = 1,
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "organization_id": organization_id,
            "repository_id": repository_id,
            "doc_type": doc_type,
            "title": title,
            # Compress generated markdown (often 5–50 KB)
            "content": compress_text(content),
            "version": version,
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def get_content(doc: Dict[str, Any]) -> str:
        return decompress_text(doc["content"]) if doc.get("content") else ""


class IndexingJob:
    COLLECTION = "indexing_jobs"

    @staticmethod
    def new(
        repository_id: str,
        status: str = "queued",
        progress_pct: int = 0,
        current_step: str = "Initializing...",
    ) -> Dict[str, Any]:
        now = utcnow()
        return {
            "_id": new_id(),
            "repository_id": repository_id,
            "status": status,
            "progress_pct": progress_pct,
            "current_step": current_step,
            "total_files": 0,
            "processed_files": 0,
            "total_chunks": 0,
            "error_message": None,
            "started_at": now,
            "completed_at": None,
        }


class UsageEvent:
    COLLECTION = "usage_events"

    @staticmethod
    def new(
        organization_id: str,
        event_type: str,
        user_id: Optional[str] = None,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
        latency_ms: int = 0,
        event_metadata: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        return {
            "_id": new_id(),
            "organization_id": organization_id,
            "user_id": user_id,
            "event_type": event_type,
            "tokens_used": tokens_used,
            "cost_usd": cost_usd,
            "latency_ms": latency_ms,
            "event_metadata": event_metadata or {},
            "created_at": utcnow(),
        }
