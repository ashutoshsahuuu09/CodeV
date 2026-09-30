import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  MessageSquareCode,
  Search,
  Code2,
  Network,
  FileText,
  Activity,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { selectedRepo, currentOrg } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/repositories', label: 'Repositories', icon: GitBranch },
    { to: '/chat', label: 'AI Chat', icon: MessageSquareCode, badge: 'RAG' },
    { to: '/search', label: 'Code Search', icon: Search },
    { to: '/explainer', label: 'Code Explainer', icon: Code2 },
    { to: '/architecture', label: 'Architecture', icon: Network },
    { to: '/documentation', label: 'Documentation', icon: FileText },
    { to: '/activity', label: 'Activity & Stats', icon: Activity },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-edge bg-bg-2 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-edge gap-2.5">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-accent-fg">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-fg">
                CodeV
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent-soft-edge">
                AI
              </span>
            </div>
            <p className="text-[11px] text-fg-subtle">Engineering Memory</p>
          </div>
        </div>

        {/* Selected Repo Banner */}
        <div className="px-4 py-3 border-b border-edge">
          <div className="text-[11px] font-medium text-fg-subtle mb-1.5 flex items-center justify-between">
            <span>Target repo</span>
            {selectedRepo?.indexing_status === 'completed' && (
              <span className="flex items-center gap-1 text-[10px] text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                Indexed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-fg bg-surface px-2.5 py-1.5 rounded-md border border-edge truncate">
            <GitBranch className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">{selectedRepo ? selectedRepo.name : 'No repo selected'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-2.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-fg-muted hover:text-fg hover:bg-surface'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg text-fg-subtle border border-edge">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Security & Org Footer */}
      <div className="p-4 border-t border-edge">
        <div className="flex items-center gap-2 text-[11px] text-fg-subtle mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Multi-tenant isolation</span>
        </div>
        <div className="text-[11px] text-fg-subtle truncate">
          Org: <span className="text-fg-muted font-medium">{currentOrg?.name || 'Personal'}</span>
        </div>
      </div>
    </aside>
  );
};
