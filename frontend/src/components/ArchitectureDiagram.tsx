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
    { id: 'client', label: 'Web / API clients', type: 'client' },
    { id: 'api_gateway', label: 'API router & auth middleware', type: 'gateway' },
    { id: 'services', label: 'Business domain services', type: 'service' },
    { id: 'database', label: 'PostgreSQL relational DB', type: 'database' },
    { id: 'redis', label: 'Redis session cache', type: 'cache' },
  ];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Globe className="w-4 h-4 text-accent" />;
      case 'gateway':
        return <Cpu className="w-4 h-4 text-accent" />;
      case 'service':
        return <Server className="w-4 h-4 text-accent" />;
      case 'database':
        return <Database className="w-4 h-4 text-success" />;
      case 'cache':
        return <Zap className="w-4 h-4 text-warning" />;
      default:
        return <Server className="w-4 h-4 text-fg-subtle" />;
    }
  };

  const getNodeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return 'HTTPS / REST';
      case 'gateway':
        return 'FastAPI / router';
      case 'service':
        return `${primaryLanguage} engine`;
      case 'database':
        return 'ACID store';
      case 'cache':
        return 'In-memory / TTL';
      default:
        return 'External';
    }
  };

  return (
    <div className="w-full bg-surface border border-edge rounded-lg p-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-edge">
        <div>
          <h4 className="text-sm font-semibold text-fg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
            Live architecture topology
          </h4>
          <p className="text-xs text-fg-muted mt-0.5">Discovered layers and interconnects across repository files</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-success bg-success-soft px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Isolated boundaries</span>
        </div>
      </div>

      {/* Dynamic Topology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
        {defaultNodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <div className="group relative bg-bg-2 border border-edge hover:border-edge-2 rounded-md p-4 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-md bg-surface border border-edge">
                  {getNodeIcon(node.type)}
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface text-fg-subtle border border-edge">
                  {getNodeBadge(node.type)}
                </span>
              </div>
              <h5 className="text-xs font-semibold text-fg group-hover:text-accent transition-colors">
                {node.label}
              </h5>
              <p className="text-[11px] text-fg-subtle mt-1 capitalize font-mono">
                Tier: {node.type}
              </p>
            </div>

            {/* Connector Arrow */}
            {index < defaultNodes.length - 1 && (
              <div className="hidden lg:flex flex-col items-center justify-center text-fg-subtle">
                <ArrowRight className="w-4 h-4 text-accent" />
                <span className="text-[9px] font-mono text-fg-subtle mt-0.5">Async</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
