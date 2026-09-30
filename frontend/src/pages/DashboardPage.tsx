import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  FileCode,
  Layers,
  MessageSquareCode,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Activity,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UsageStats, Repository } from '../types';

export const DashboardPage: React.FC = () => {
  const { currentOrg, repositories, selectedRepo, setSelectedRepo } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getUsageStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repositories]);

  const quickPrompts = [
    { title: 'Explain Repository Architecture', prompt: 'Explain the overall architecture and high-level structure of this repository.' },
    { title: 'How Authentication Works', prompt: 'How does authentication, password hashing, and session management work in this codebase?' },
    { title: 'Where is Payment Logic Implemented?', prompt: 'Where is payment processing and webhook verification implemented in this repo?' },
    { title: 'Identify Entry Points & Endpoints', prompt: 'What are the main entry points and API route endpoints in this repository?' },
  ];

  const handlePromptClick = (prompt: string) => {
    navigate('/chat', { state: { initialPrompt: prompt } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Workspace Overview
            </span>
            <span className="text-xs text-slate-400 font-mono">Organization: {currentOrg?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            CodeV Developer Platform
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Ask natural language questions about your company's codebase with exact source line citations.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => navigate('/repositories')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connected Repos</p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{stats?.total_repositories ?? repositories.length}</p>
            <span className="text-xs text-slate-400">Active</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Indexed Code Files</p>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{stats?.total_indexed_files ?? 0}</p>
            <span className="text-xs text-cyan-400 font-mono">AST Parsed</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vector Code Chunks</p>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{stats?.total_code_chunks ?? 0}</p>
            <span className="text-xs text-emerald-400 font-mono">1536-dim</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI RAG Queries</p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <MessageSquareCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white">{stats?.total_queries ?? 0}</p>
            <span className="text-xs text-slate-400">Answered</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Questions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Quick Codebase Queries</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(qp.prompt)}
              className="text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all duration-150 group"
            >
              <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {qp.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {qp.prompt}
              </p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
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
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>Repositories ({repositories.length})</span>
            </h3>
            <button
              onClick={() => navigate('/repositories')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View All
            </button>
          </div>

          {repositories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>No repositories connected yet.</p>
              <button
                onClick={() => navigate('/repositories')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 text-xs font-semibold"
              >
                Connect Sample Repository
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
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs">
                      {repo.primary_language.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 font-mono">{repo.name}</h4>
                      <p className="text-[11px] text-slate-400">{repo.primary_language} · {repo.chunk_count} chunks indexed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {repo.indexing_status === 'completed' ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/40 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Indexing {repo.indexing_progress}%
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Indexing Jobs */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Indexing Pipelines</span>
            </h3>

            {(!stats?.recent_indexing_jobs || stats.recent_indexing_jobs.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent indexing tasks.</p>
            ) : (
              <div className="space-y-3">
                {stats.recent_indexing_jobs.slice(0, 3).map((job) => (
                  <div key={job.job_id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 font-mono">{job.repository_name}</span>
                      <span className="text-[10px] uppercase font-mono text-cyan-400">{job.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{job.current_step}</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${job.progress_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Vector Engine: <strong>Local pgvector / Hybrid</strong></span>
            <span className="text-emerald-400">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
