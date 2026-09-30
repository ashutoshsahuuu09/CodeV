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
  Layers,
  Sparkles,
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
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/90 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-xl z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                CodeV
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Engineering Memory</p>
          </div>
        </div>

        {/* Selected Repo Banner */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/30">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Target Repo</span>
            {selectedRepo?.indexing_status === 'completed' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Indexed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-200 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{selectedRepo ? selectedRepo.name : 'No repo selected'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Security & Org Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-tenant Isolation</span>
        </div>
        <div className="text-[11px] text-slate-400 truncate">
          Org: <span className="text-slate-300 font-semibold">{currentOrg?.name || 'Personal'}</span>
        </div>
      </div>
    </aside>
  );
};
