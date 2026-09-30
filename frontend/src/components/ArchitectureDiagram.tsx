import React from 'react';
import { Server, Database, Globe, Cpu, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

interface ArchitectureDiagramProps {
  nodes?: Array<{ id: string; label: string; type: string }>;
  edges?: Array<{ from: string; to: string; label: string }>;
  primaryLanguage?: string;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  nodes,
  edges,
  primaryLanguage = 'Python',
}) => {
  const defaultNodes = nodes && nodes.length > 0 ? nodes : [
    { id: 'client', label: 'Web / API Clients', type: 'client' },
    { id: 'api_gateway', label: 'API Router & Auth Middleware', type: 'gateway' },
    { id: 'services', label: 'Business Domain Services', type: 'service' },
    { id: 'database', label: 'PostgreSQL Relational DB', type: 'database' },
    { id: 'redis', label: 'Redis Session Cache', type: 'cache' },
  ];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'gateway':
        return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'service':
        return <Server className="w-5 h-5 text-indigo-400" />;
      case 'database':
        return <Database className="w-5 h-5 text-emerald-400" />;
      case 'cache':
        return <Zap className="w-5 h-5 text-amber-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNodeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return 'HTTPS / REST';
      case 'gateway':
        return 'FastAPI / Router';
      case 'service':
        return `${primaryLanguage} Engine`;
      case 'database':
        return 'ACID Store';
      case 'cache':
        return 'In-Memory / TTL';
      default:
        return 'External';
    }
  };

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Live Architecture Topology
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Discovered layers and interconnects across repository files</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Isolated Boundaries</span>
          </div>
        </div>

        {/* Dynamic Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
          {defaultNodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <div className="group relative bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    {getNodeIcon(node.type)}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {getNodeBadge(node.type)}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {node.label}
                </h5>
                <p className="text-[11px] text-slate-400 mt-1 capitalize font-mono">
                  Tier: {node.type}
                </p>
              </div>

              {/* Connector Arrow */}
              {index < defaultNodes.length - 1 && (
                <div className="hidden lg:flex flex-col items-center justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-cyan-400/60 animate-pulse" />
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">Async</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
