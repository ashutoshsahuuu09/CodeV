import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  FileCode,
  Layers,
  MessageSquareCode,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UsageStats } from '../types';

export const DashboardPage: React.FC = () => {
  const { currentOrg, repositories, selectedRepo, setSelectedRepo } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getUsageStats()
      .then(setStats)
      .catch(console.error);
  }, [repositories]);

  const quickPrompts = [
    { title: 'Explain repository architecture', prompt: 'Explain the overall architecture and high-level structure of this repository.' },
    { title: 'How authentication works', prompt: 'How does authentication, password hashing, and session management work in this codebase?' },
    { title: 'Where is payment logic implemented?', prompt: 'Where is payment processing and webhook verification implemented in this repo?' },
    { title: 'Identify entry points & endpoints', prompt: 'What are the main entry points and API route endpoints in this repository?' },
  ];

  const handlePromptClick = (prompt: string) => {
    navigate('/chat', { state: { initialPrompt: prompt } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-lg border border-edge">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-accent-soft text-accent text-[11px] font-medium border border-accent-soft-edge">
              Workspace overview
            </span>
            <span className="text-xs text-fg-subtle font-mono">Org: {currentOrg?.name}</span>
          </div>
          <h1 className="text-xl font-semibold text-fg tracking-tight">
            CodeV developer platform
          </h1>
          <p className="text-xs text-fg-muted max-w-xl">
            Ask natural language questions about your company's codebase with exact source line citations.
          </p>
        </div>

        <button
          onClick={() => navigate('/repositories')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Connect repository</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-lg border border-edge">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-fg-subtle">Connected repos</p>
            <div className="p-1.5 rounded-md bg-accent-soft text-accent">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-fg">{stats?.total_repositories ?? repositories.length}</p>
            <span className="text-xs text-fg-subtle">Active</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-edge">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-fg-subtle">Indexed code files</p>
            <div className="p-1.5 rounded-md bg-accent-soft text-accent">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-fg">{stats?.total_indexed_files ?? 0}</p>
            <span className="text-xs text-accent font-mono">AST parsed</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-edge">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-fg-subtle">Vector code chunks</p>
            <div className="p-1.5 rounded-md bg-accent-soft text-accent">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-fg">{stats?.total_code_chunks ?? 0}</p>
            <span className="text-xs text-success font-mono">1536-dim</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-edge">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-fg-subtle">AI RAG queries</p>
            <div className="p-1.5 rounded-md bg-accent-soft text-accent">
              <MessageSquareCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-fg">{stats?.total_queries ?? 0}</p>
            <span className="text-xs text-fg-subtle">Answered</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Questions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Quick codebase queries</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(qp.prompt)}
              className="text-left p-4 rounded-lg bg-surface border border-edge hover:border-edge-2 transition-colors group"
            >
              <p className="text-xs font-semibold text-fg group-hover:text-accent transition-colors">
                {qp.title}
              </p>
              <p className="text-[11px] text-fg-subtle mt-1 line-clamp-2">
                {qp.prompt}
              </p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-accent">
                <span>Ask AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Repositories & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Repositories Section */}
        <div className="lg:col-span-2 bg-surface rounded-lg p-6 border border-edge">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent" />
              <span>Repositories ({repositories.length})</span>
            </h3>
            <button
              onClick={() => navigate('/repositories')}
              className="text-xs text-accent hover:text-accent-strong font-medium"
            >
              View all
            </button>
          </div>

          {repositories.length === 0 ? (
            <div className="py-8 text-center text-fg-muted text-xs">
              <p>No repositories connected yet.</p>
              <button
                onClick={() => navigate('/repositories')}
                className="mt-3 px-3 py-1.5 rounded-md bg-bg-2 text-accent text-xs font-semibold border border-edge"
              >
                Connect sample repository
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {repositories.slice(0, 4).map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => {
                    setSelectedRepo(repo);
                    navigate('/chat');
                  }}
                  className="flex items-center justify-between p-3.5 rounded-md bg-bg-2 border border-edge hover:border-edge-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-accent-soft border border-accent-soft-edge flex items-center justify-center text-accent font-mono text-xs font-semibold">
                      {repo.primary_language.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-fg font-mono">{repo.name}</h4>
                      <p className="text-[11px] text-fg-subtle">{repo.primary_language} · {repo.chunk_count} chunks indexed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {repo.indexing_status === 'completed' ? (
                      <span className="flex items-center gap-1.5 text-xs text-success bg-success-soft px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-warning bg-warning-soft px-2.5 py-1 rounded-full font-medium">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        Indexing {repo.indexing_progress}%
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-fg-subtle" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Indexing Jobs */}
        <div className="bg-surface rounded-lg p-6 border border-edge flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-accent" />
              <span>Indexing pipelines</span>
            </h3>

            {(!stats?.recent_indexing_jobs || stats.recent_indexing_jobs.length === 0) ? (
              <p className="text-xs text-fg-subtle py-6 text-center">No recent indexing tasks.</p>
            ) : (
              <div className="space-y-3">
                {stats.recent_indexing_jobs.slice(0, 3).map((job) => (
                  <div key={job.job_id} className="p-3 rounded-md bg-bg-2 border border-edge text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-fg font-mono">{job.repository_name}</span>
                      <span className="text-[10px] uppercase font-mono text-accent">{job.status}</span>
                    </div>
                    <p className="text-[11px] text-fg-subtle truncate">{job.current_step}</p>
                    <div className="w-full bg-edge h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-accent h-full rounded-full transition-all duration-300"
                        style={{ width: `${job.progress_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-edge text-[11px] text-fg-subtle flex items-center justify-between">
            <span>Vector engine: <strong className="text-fg-muted">Local pgvector / Hybrid</strong></span>
            <span className="text-success">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
