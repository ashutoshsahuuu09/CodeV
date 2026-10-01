import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  RefreshCw,
  Trash2,
  MessageSquareCode,
  Search,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" />
            <span>Connected repositories</span>
          </h1>
          <p className="text-xs text-fg-muted mt-1">
            Connect and index GitHub codebases for deep semantic search and AI comprehension.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshRepositories()}
            className="p-2 rounded-md bg-surface border border-edge hover:border-edge-2 text-fg-muted transition-colors"
            title="Refresh repository status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Connect repository</span>
          </button>
        </div>
      </div>

      {/* Repositories Grid */}
      {repositories.length === 0 ? (
        <div className="bg-surface p-12 rounded-lg border border-edge text-center space-y-4">
          <div className="w-11 h-11 rounded-lg bg-accent-soft border border-accent-soft-edge flex items-center justify-center text-accent mx-auto">
            <GitBranch className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-fg">No repositories connected yet</h3>
            <p className="text-xs text-fg-muted max-w-md mx-auto">
              Connect a public or private GitHub repository, or use one of our instant production templates below.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-md bg-accent text-accent-fg font-semibold text-xs"
            >
              Connect GitHub repo
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
                className={`rounded-lg p-6 border transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-accent bg-surface ring-1 ring-accent/30'
                    : 'border-edge hover:border-edge-2 bg-surface'
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-accent-soft border border-accent-soft-edge flex items-center justify-center text-accent font-mono text-xs font-semibold shrink-0">
                        {repo.primary_language.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-fg truncate font-mono">{repo.name}</h3>
                        <p className="text-[11px] text-fg-subtle truncate">{repo.full_name}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        repo.indexing_status === 'completed'
                          ? 'bg-success-soft text-success border-transparent'
                          : repo.indexing_status === 'indexing'
                          ? 'bg-warning-soft text-warning border-transparent'
                          : 'bg-bg-2 text-fg-subtle border-edge'
                      }`}
                    >
                      {repo.indexing_status}
                    </span>
                  </div>

                  <p className="text-xs text-fg-muted line-clamp-2 mb-4 h-8">
                    {repo.description || 'No description provided.'}
                  </p>

                  {/* Indexing progress bar if active */}
                  {repo.indexing_status === 'indexing' && (
                    <div className="mb-4 bg-bg-2 p-2.5 rounded-md border border-edge">
                      <div className="flex justify-between text-[10px] text-warning font-mono mb-1">
                        <span>Indexing code chunks…</span>
                        <span>{repo.indexing_progress}%</span>
                      </div>
                      <div className="w-full bg-edge h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-warning h-full rounded-full transition-all duration-300"
                          style={{ width: `${repo.indexing_progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Badges */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-edge mb-4 text-xs font-mono">
                    <div className="bg-bg-2 p-2 rounded-md border border-edge">
                      <span className="text-[10px] text-fg-subtle block font-sans">Indexed files</span>
                      <span className="text-fg font-semibold">{repo.file_count} files</span>
                    </div>
                    <div className="bg-bg-2 p-2 rounded-md border border-edge">
                      <span className="text-[10px] text-fg-subtle block font-sans">Code chunks</span>
                      <span className="text-accent font-semibold">{repo.chunk_count} chunks</span>
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
                      className="px-3 py-1.5 rounded-md bg-accent-soft hover:bg-accent-soft-edge border border-accent-soft-edge text-accent text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquareCode className="w-3.5 h-3.5" />
                      <span>AI chat</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepo(repo);
                        navigate('/search');
                      }}
                      className="p-1.5 rounded-md bg-bg-2 hover:bg-surface-2 border border-edge text-fg-muted text-xs transition-colors"
                      title="Semantic code search"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleReindex(repo.id, e)}
                      disabled={reindexingId === repo.id || repo.indexing_status === 'indexing'}
                      className="p-1.5 rounded-md hover:bg-bg-2 text-fg-subtle hover:text-fg transition-colors disabled:opacity-40"
                      title="Re-index repository"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reindexingId === repo.id ? 'animate-spin text-accent' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(repo.id, e)}
                      className="p-1.5 rounded-md hover:bg-danger-soft text-fg-subtle hover:text-danger transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xl bg-surface-2 border border-edge rounded-lg p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" />
                <span>Connect GitHub repository</span>
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-danger-soft border border-danger/30 text-danger text-xs">
                {error}
              </div>
            )}

            {/* Custom URL Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">
                  GitHub repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/repository"
                  className="w-full px-3.5 py-2.5 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">
                  Default branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-fg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              <button
                onClick={() => handleConnect()}
                disabled={connecting || !repoUrl}
                className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs disabled:opacity-50 transition-colors"
              >
                {connecting ? 'Ingesting repository…' : 'Connect & index'}
              </button>
            </div>

            {/* 1-Click Starter Demo Templates */}
            <div className="pt-4 border-t border-edge space-y-3">
              <p className="text-xs font-medium text-fg-muted">
                Or 1-click instant templates:
              </p>
              <div className="space-y-2">
                {sampleRepos.map((sample) => (
                  <div
                    key={sample.name}
                    className="p-3 rounded-md bg-bg border border-edge flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-fg font-mono">{sample.name}</p>
                      <p className="text-[11px] text-fg-subtle">{sample.description}</p>
                    </div>
                    <button
                      onClick={() => handleConnect(sample.html_url)}
                      disabled={connecting}
                      className="px-3 py-1 rounded-md bg-bg-2 hover:bg-surface-2 border border-edge text-accent text-xs font-semibold transition-colors shrink-0 ml-3"
                    >
                      Use sample
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
