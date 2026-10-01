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
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './LogoMark';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
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

  const handleNavClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const renderContent = (isMobile: boolean = false) => (
    <div className="flex flex-col justify-between h-full select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-edge overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center min-w-0">
              <LogoMark size={42} className="drop-shadow-[0_0_12px_rgba(255,255,255,0.08)] w-7 sm:w-8 md:w-9 lg:w-10" />
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
          {isMobile && (
            <button
              onClick={() => setMobileOpen?.(false)}
              className="p-1.5 rounded-md hover:bg-surface text-fg-muted hover:text-fg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
                onClick={handleNavClick}
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex w-64 border-r border-edge bg-bg-2 flex-col justify-between h-screen sticky top-0 z-30 select-none shrink-0">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen?.(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-bg-2 border-r border-edge h-full z-50 flex flex-col shadow-2xl">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
