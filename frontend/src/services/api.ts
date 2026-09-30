import type {
  AuthResponse, User, Organization, OrgMember, Repository, RepositoryDetail,
  FileContent, FileTreeItem, Message, Conversation, ConversationDetail,
  SearchResponse, CodeExplanation, GeneratedDocument, UsageStats
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('CodeV_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const orgId = localStorage.getItem('CodeV_org_id');
    if (orgId) {
      headers['X-Organization-Id'] = orgId;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `Request failed: ${res.status} ${res.statusText}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.detail || errJson.message || errMsg;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errMsg);
    }

    if (res.status === 204) {
      return {} as T;
    }
    return res.json();
  }

  // Auth Endpoints
  async register(data: { email: string; password: string; full_name: string; organization_name?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('CodeV_token');
      localStorage.removeItem('CodeV_org_id');
    }
  }

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/organizations');
  }

  async getCurrentOrg(): Promise<Organization> {
    return this.request<Organization>('/organizations/current');
  }

  async createOrganization(data: { name: string; description?: string }): Promise<Organization> {
    return this.request<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrgMembers(): Promise<OrgMember[]> {
    return this.request<OrgMember[]>('/organizations/members');
  }

  async addOrgMember(data: { email: string; role?: string }): Promise<OrgMember> {
    return this.request<OrgMember>('/organizations/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Repositories
  async getRepositories(): Promise<Repository[]> {
    return this.request<Repository[]>('/repositories');
  }

  async getSampleRepositories(): Promise<any[]> {
    return this.request<any[]>('/repositories/samples');
  }

  async connectRepository(data: { repo_url: string; branch?: string }): Promise<Repository> {
    return this.request<Repository>('/repositories/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRepository(repoId: string): Promise<RepositoryDetail> {
    return this.request<RepositoryDetail>(`/repositories/${repoId}`);
  }

  async triggerIndexing(repoId: string): Promise<any> {
    return this.request(`/repositories/${repoId}/index`, {
      method: 'POST',
      body: JSON.stringify({ force_reindex: true }),
    });
  }

  async getIndexingStatus(repoId: string): Promise<any> {
    return this.request(`/repositories/${repoId}/status`);
  }

  async getRepositoryFiles(repoId: string): Promise<FileTreeItem[]> {
    return this.request<FileTreeItem[]>(`/repositories/${repoId}/files`);
  }

  async getFileContent(repoId: string, path: string): Promise<FileContent> {
    return this.request<FileContent>(`/repositories/${repoId}/files/content?path=${encodeURIComponent(path)}`);
  }

  async deleteRepository(repoId: string): Promise<void> {
    return this.request(`/repositories/${repoId}`, { method: 'DELETE' });
  }

  // Chat & RAG
  async sendChatMessage(data: { repository_id: string; message: string; conversation_id?: string }): Promise<Message> {
    return this.request<Message>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversations(repoId?: string): Promise<Conversation[]> {
    const url = repoId ? `/chat/conversations?repository_id=${repoId}` : '/chat/conversations';
    return this.request<Conversation[]>(url);
  }

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    return this.request<ConversationDetail>(`/chat/conversations/${conversationId}`);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    return this.request(`/chat/conversations/${conversationId}`, { method: 'DELETE' });
  }

  // Code Search
  async searchCode(data: { repository_id: string; query: string; language?: string; path_filter?: string; limit?: number }): Promise<SearchResponse> {
    return this.request<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Code Explainer
  async explainCode(data: { repository_id: string; file_path: string; code_snippet?: string; symbol_name?: string; start_line?: number; end_line?: number }): Promise<CodeExplanation> {
    return this.request<CodeExplanation>('/code/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Documentation
  async generateDocumentation(data: { repository_id: string; doc_type: string; custom_instructions?: string }): Promise<GeneratedDocument> {
    return this.request<GeneratedDocument>('/documentation/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRepositoryDocs(repoId: string): Promise<GeneratedDocument[]> {
    return this.request<GeneratedDocument[]>(`/documentation/${repoId}`);
  }

  // Usage & Dashboard
  async getUsageStats(): Promise<UsageStats> {
    return this.request<UsageStats>('/usage/stats');
  }
}

export const api = new ApiClient();
