export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  plan: string;
  created_at: string;
  role?: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  current_organization_id: string;
}

export interface Repository {
  id: string;
  organization_id: string;
  name: string;
  full_name: string;
  description?: string | null;
  default_branch: string;
  is_private: boolean;
  primary_language: string;
  html_url?: string | null;
  indexing_status: 'pending' | 'indexing' | 'completed' | 'failed';
  indexing_progress: number;
  last_indexed_at?: string | null;
  file_count: number;
  chunk_count: number;
  created_at: string;
}

export interface FileTreeItem {
  id: string;
  file_path: string;
  file_name: string;
  language: string;
  size_bytes: number;
  line_count: number;
  content_summary?: string | null;
}

export interface ArchitectureOverview {
  project_summary: string;
  technology_stack: string[];
  primary_language: string;
  architecture_pattern: string;
  entry_points: string[];
  important_modules: string[];
  api_endpoints: Array<{ method: string; path: string; file: string }>;
  database_models: Array<{ name: string; file: string }>;
  external_services: string[];
  authentication_flow: string[];
  potentially_complex_areas: string[];
  diagram?: {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
}

export interface RepositoryDetail extends Repository {
  repo_metadata?: Record<string, any>;
  architecture_overview?: ArchitectureOverview;
  files?: FileTreeItem[];
}

export interface FileContent {
  id: string;
  file_path: string;
  file_name: string;
  language: string;
  raw_content: string;
  line_count: number;
  size_bytes: number;
}

export interface SourceCitation {
  file_path: string;
  start_line: number;
  end_line: number;
  symbol?: string | null;
  symbol_type?: string | null;
  language?: string | null;
  relevance_score?: number | null;
  snippet?: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  repository_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_preview?: string | null;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface SearchResultItem {
  chunk_id: string;
  file_path: string;
  symbol_name?: string | null;
  symbol_type?: string | null;
  language: string;
  start_line: number;
  end_line: number;
  code_snippet: string;
  relevance_score: number;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface CodeExplanation {
  file_path: string;
  symbol_name?: string | null;
  summary: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  important_logic: string[];
  edge_cases: string[];
  potential_issues: string[];
  full_markdown: string;
}

export interface GeneratedDocument {
  id: string;
  repository_id: string;
  doc_type: string;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  total_repositories: number;
  total_indexed_files: number;
  total_code_chunks: number;
  total_queries: number;
  total_documents: number;
  recent_indexing_jobs: Array<{
    job_id: string;
    repository_name: string;
    status: string;
    progress_pct: number;
    current_step: string;
    total_files: number;
    started_at?: string;
  }>;
  recent_activity: Array<{
    id: string;
    event_type: string;
    tokens_used: number;
    latency_ms: number;
    created_at?: string;
    metadata?: Record<string, any>;
  }>;
}
