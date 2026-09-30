import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  RefreshCw,
  Trash2,
  MessageSquareCode,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  FileCode,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Repository } from '../types';

export const RepositoriesPage: React.FC = () => {
  const { repositories, refreshRepositories, setSelectedRepo, selectedRepo } = useAuth();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [sampleRepos, setSampleRepos] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    api.getSampleRepositories().then(setSampleRepos).catch(console.error);

    // Poll status for any repo currently indexing
    const interval = setInterval(() => {
      const isAnyIndexing = repositories.some(r => r.indexing_status === 'indexing');
      if (isAnyIndexing) {
        refreshRepositories();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [repositories]);

  const handleConnect = async (urlToConnect?: string) => {
    const targetUrl = urlToConnect || repoUrl;
    if (!targetUrl) return;

    setError(null);
    setConnecting(true);
    try {
      const newRepo = await api.connectRepository({
        repo_url: targetUrl,
        branch: branch || 'main',
      });
      setShowConnectModal(false);
      setRepoUrl('');
      await refreshRepositories();
      setSelectedRepo(newRepo);
    } catch (err: any) {
      setError(err.message || 'Failed to connect repository');
    } finally {
      setConnecting(false);
    }
  };

  const handleReindex = async (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReindexingId(repoId);
    try {
      await api.triggerIndexing(repoId);
      await refreshRepositories();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger indexing');
    } finally {
      setReindexingId(null);
    }
  };

  const handleDelete = async (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this repository and all its indexed chunks?')) return;
    try {
      await api.deleteRepository(repoId);
      await refreshRepositories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete repository');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-cyan-400" />
            <span>Connected Repositories</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect and index GitHub codebases for deep semantic search and AI comprehension.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshRepositories()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh repository status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Repositories Grid */}
      {repositories.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <GitBranch className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Repositories Connected Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Connect a public or private GitHub repository, or use one of our instant production templates below.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
            >
              Connect GitHub Repo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => {
            const isSelected = selectedRepo?.id === repo.id;
            return (
              <div
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                className={`glass-panel rounded-2xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500/50 bg-slate-900/90 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0">
                        {repo.primary_language.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate font-mono">{repo.name}</h3>
                        <p className="text-[11px] text-slate-400 truncate">{repo.full_name}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        repo.indexing_status === 'completed'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                          : repo.indexing_status === 'indexing'
                          ? 'bg-amber-950/40 text-amber-400 border-amber-800/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {repo.indexing_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 h-8">
                    {repo.description || 'No description provided.'}
                  </p>

                  {/* Indexing progress bar if active */}
                  {repo.indexing_status === 'indexing' && (
                    <div className="mb-4 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <div className="flex justify-between text-[10px] text-amber-400 font-mono mb-1">
                        <span>Indexing code chunks...</span>
                        <span>{repo.indexing_progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${repo.indexing_progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Badges */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/80 mb-4 text-xs font-mono">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                      <span className="text-[10px] text-slate-400 block font-sans">Indexed Files</span>
                      <span className="text-slate-200 font-bold">{repo.file_count} files</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                      <span className="text-[10px] text-slate-400 block font-sans">Code Chunks</span>
                      <span className="text-cyan-400 font-bold">{repo.chunk_count} chunks</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepo(repo);
                        navigate('/chat');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquareCode className="w-3.5 h-3.5" />
                      <span>AI Chat</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepo(repo);
                        navigate('/search');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      title="Semantic Code Search"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleReindex(repo.id, e)}
                      disabled={reindexingId === repo.id || repo.indexing_status === 'indexing'}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
                      title="Re-index repository"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reindexingId === repo.id ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(repo.id, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove repository"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Connect GitHub Repository</span>
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Custom URL Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/repository"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
                />
              </div>

              <button
                onClick={() => handleConnect()}
                disabled={connecting || !repoUrl}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
              >
                {connecting ? 'Ingesting Repository...' : 'Connect & Index'}
              </button>
            </div>

            {/* 1-Click Starter Demo Templates */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Or 1-Click Instant Templates:
              </p>
              <div className="space-y-2">
                {sampleRepos.map((sample) => (
                  <div
                    key={sample.name}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200 font-mono">{sample.name}</p>
                      <p className="text-[11px] text-slate-400">{sample.description}</p>
                    </div>
                    <button
                      onClick={() => handleConnect(sample.html_url)}
                      disabled={connecting}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors shrink-0 ml-3"
                    >
                      Use Sample
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
