from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- AUTH & USER SCHEMAS -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    organization_name: Optional[str] = "My Engineering Team"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    current_organization_id: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    org_id: Optional[str] = None
    exp: Optional[int] = None

# ----------------- ORGANIZATION SCHEMAS -----------------
class OrgCreate(BaseModel):
    name: str
    description: Optional[str] = None

class OrgOut(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    plan: str
    created_at: datetime
    role: Optional[str] = "member"

    class Config:
        from_attributes = True

class OrgMemberAdd(BaseModel):
    email: EmailStr
    role: str = "member"

class OrgMemberOut(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

# ----------------- GITHUB & REPOSITORY SCHEMAS -----------------
class GitHubConnectPAT(BaseModel):
    personal_access_token: str
    github_username: Optional[str] = None

class RepoConnectUrl(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"
    is_sample: Optional[bool] = False

class RepoIndexRequest(BaseModel):
    force_reindex: Optional[bool] = False

class RepoOut(BaseModel):
    id: str
    organization_id: str
    name: str
    full_name: str
    description: Optional[str] = None
    default_branch: str
    is_private: bool
    primary_language: str
    html_url: Optional[str] = None
    indexing_status: str
    indexing_progress: int
    last_indexed_at: Optional[datetime] = None
    file_count: int
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class FileTreeItem(BaseModel):
    id: str
    file_path: str
    file_name: str
    language: str
    size_bytes: int
    line_count: int
    content_summary: Optional[str] = None

class RepoDetailOut(RepoOut):
    repo_metadata: Optional[Dict[str, Any]] = None
    architecture_overview: Optional[Dict[str, Any]] = None
    files: Optional[List[FileTreeItem]] = None

class FileContentOut(BaseModel):
    id: str
    file_path: str
    file_name: str
    language: str
    raw_content: str
    line_count: int
    size_bytes: int

class IndexingStatusOut(BaseModel):
    job_id: Optional[str] = None
    repository_id: str
    status: str
    progress_pct: int
    current_step: str
    total_files: int
    processed_files: int
    total_chunks: int
    error_message: Optional[str] = None

# ----------------- CHAT & RAG SCHEMAS -----------------
class SourceCitation(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    symbol: Optional[str] = None
    symbol_type: Optional[str] = None
    language: Optional[str] = None
    relevance_score: Optional[float] = None
    snippet: Optional[str] = None

class ChatQueryRequest(BaseModel):
    repository_id: str
    conversation_id: Optional[str] = None
    message: str
    stream: Optional[bool] = False

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[List[SourceCitation]] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    repository_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_preview: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationDetailOut(ConversationOut):
    messages: List[MessageOut]

# ----------------- CODE EXPLAINER & SEARCH SCHEMAS -----------------
class CodeExplainRequest(BaseModel):
    repository_id: str
    file_path: str
    code_snippet: Optional[str] = None
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    symbol_name: Optional[str] = None

class CodeExplanationOut(BaseModel):
    file_path: str
    symbol_name: Optional[str] = None
    summary: str
    inputs: List[str]
    outputs: List[str]
    dependencies: List[str]
    important_logic: List[str]
    edge_cases: List[str]
    potential_issues: List[str]
    full_markdown: str

class CodeSearchRequest(BaseModel):
    repository_id: str
    query: str
    language: Optional[str] = None
    path_filter: Optional[str] = None
    limit: Optional[int] = 15

class SearchResultItem(BaseModel):
    chunk_id: str
    file_path: str
    symbol_name: Optional[str] = None
    symbol_type: Optional[str] = None
    language: str
    start_line: int
    end_line: int
    code_snippet: str
    relevance_score: float

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]

# ----------------- DOCUMENTATION SCHEMAS -----------------
class DocGenerateRequest(BaseModel):
    repository_id: str
    doc_type: str = "readme" # readme, api_docs, architecture, module, setup, onboarding
    custom_instructions: Optional[str] = None

class DocOut(BaseModel):
    id: str
    organization_id: Optional[str] = None
    repository_id: str
    doc_type: str
    title: str
    content: str
    version: int
    created_at: datetime
    updated_at: datetime

# ----------------- USAGE & METRICS SCHEMAS -----------------
class UsageStatsOut(BaseModel):
    total_repositories: int
    total_indexed_files: int
    total_code_chunks: int
    total_queries: int
    total_documents: int
    recent_indexing_jobs: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
