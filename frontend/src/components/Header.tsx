import React, { useState } from 'react';
import {
  GitBranch,
  Building2,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, currentOrg, organizations, switchOrganization, repositories, selectedRepo, setSelectedRepo, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-edge bg-bg-2 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Global Repo Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowRepoDropdown(!showRepoDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-surface border border-edge hover:border-edge-2 text-xs font-medium text-fg transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-accent" />
            <span className="max-w-[200px] truncate">
              {selectedRepo ? selectedRepo.full_name : 'Select repository…'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-fg-subtle" />
          </button>

          {showRepoDropdown && (
            <div className="absolute left-0 mt-2 w-72 rounded-md bg-surface-2 border border-edge shadow-lg py-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-edge">
                Connected repositories ({repositories.length})
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {repositories.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-fg-subtle text-center">
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
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface transition-colors ${
                        selectedRepo?.id === repo.id ? 'bg-accent-soft text-accent font-medium' : 'text-fg-muted'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-mono">{repo.name}</p>
                        <p className="text-[10px] text-fg-subtle truncate">{repo.primary_language} · {repo.chunk_count} chunks</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
                        repo.indexing_status === 'completed' ? 'bg-success' : repo.indexing_status === 'indexing' ? 'bg-warning' : 'bg-fg-subtle'
                      }`} />
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-edge px-2 pt-1.5">
                <button
                  onClick={() => {
                    setShowRepoDropdown(false);
                    navigate('/repositories');
                  }}
                  className="w-full text-center py-1.5 text-xs text-accent hover:text-accent-strong font-medium"
                >
                  + Connect new repository
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedRepo && (
          <div className="hidden md:flex items-center gap-2 text-xs text-fg-subtle">
            <span>{selectedRepo.primary_language}</span>
            <span>·</span>
            <span>{selectedRepo.chunk_count} code chunks indexed</span>
          </div>
        )}
      </div>

      {/* Right: Quick Search, Theme, Org Switcher & User Profile */}
      <div className="flex items-center gap-2">
        {/* Quick Search Shortcut */}
        <button
          onClick={() => navigate('/search')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-edge text-xs text-fg-subtle hover:text-fg hover:border-edge-2 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Semantic search code…</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-bg text-fg-subtle rounded border border-edge font-mono">⌘K</kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-md bg-surface border border-edge hover:border-edge-2 text-fg-muted hover:text-fg transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Organization Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface border border-edge hover:border-edge-2 text-xs text-fg-muted transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-fg-subtle" />
            <span className="max-w-[120px] truncate">{currentOrg?.name || 'Workspace'}</span>
            <ChevronDown className="w-3 h-3 text-fg-subtle" />
          </button>

          {showOrgDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-md bg-surface-2 border border-edge shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-edge">
                Switch organization
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface transition-colors ${
                    currentOrg?.id === org.id ? 'bg-accent-soft text-accent font-medium' : 'text-fg-muted'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  <span className="text-[10px] text-fg-subtle uppercase">{org.plan}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-surface transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-fg">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className="w-3 h-3 text-fg-subtle" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 rounded-md bg-surface-2 border border-edge shadow-lg py-2 z-50">
              <div className="px-3 py-2 border-b border-edge">
                <p className="text-xs font-semibold text-fg">{user?.full_name}</p>
                <p className="text-[11px] text-fg-subtle truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-fg-muted hover:bg-surface flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-fg-subtle" />
                <span>Account settings</span>
              </button>
              <button
                onClick={async () => {
                  setShowUserDropdown(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-xs text-danger hover:bg-danger-soft flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
