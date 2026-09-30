import React, { useState } from 'react';
import {
  GitBranch,
  Building2,
  LogOut,
  ChevronDown,
  User as UserIcon,
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, currentOrg, organizations, switchOrganization, repositories, selectedRepo, setSelectedRepo, logout, refreshRepositories } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Global Repo Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowRepoDropdown(!showRepoDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[200px] truncate">
              {selectedRepo ? selectedRepo.full_name : 'Select Repository...'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRepoDropdown && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Connected Repositories ({repositories.length})
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {repositories.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-400 text-center">
                    No repositories connected yet.
                  </div>
                ) : (
                  repositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        setSelectedRepo(repo);
                        setShowRepoDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                        selectedRepo?.id === repo.id ? 'bg-cyan-500/10 text-cyan-300 font-medium' : 'text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-mono">{repo.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{repo.primary_language} · {repo.chunk_count} chunks</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
                        repo.indexing_status === 'completed' ? 'bg-emerald-400' : repo.indexing_status === 'indexing' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                      }`} />
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-slate-800 px-2 pt-1.5">
                <button
                  onClick={() => {
                    setShowRepoDropdown(false);
                    navigate('/repositories');
                  }}
                  className="w-full text-center py-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  + Connect New Repository
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedRepo && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-300">{selectedRepo.primary_language}</span>
            <span className="text-slate-600">·</span>
            <span>{selectedRepo.chunk_count} code chunks indexed</span>
          </div>
        )}
      </div>

      {/* Right: Quick Search, Org Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search Shortcut */}
        <button
          onClick={() => navigate('/search')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Semantic search code...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">⌘K</kbd>
        </button>

        {/* Organization Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="max-w-[120px] truncate">{currentOrg?.name || 'Workspace'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showOrgDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Switch Organization
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    currentOrg?.id === org.id ? 'bg-cyan-500/10 text-cyan-300 font-medium' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{org.plan}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-200">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={async () => {
                  setShowUserDropdown(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
