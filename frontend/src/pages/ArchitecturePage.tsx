import React, { useState, useEffect } from 'react';
import {
  Network,
  Cpu,
  Layers,
  Server,
  Database,
  Globe,
  ShieldCheck,
  FileCode,
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RepositoryDetail } from '../types';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';

export const ArchitecturePage: React.FC = () => {
  const { selectedRepo } = useAuth();
  const [repoDetail, setRepoDetail] = useState<RepositoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedRepo) {
      setLoading(true);
      api.getRepository(selectedRepo.id)
        .then(setRepoDetail)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedRepo]);

  const overview = repoDetail?.architecture_overview;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Network className="w-6 h-6 text-cyan-400" />
          <span>Repository Architecture & Overview</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated architectural topology, endpoint discovery, database models, and complex boundary maps.
        </p>
      </div>

      {!selectedRepo ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
          Please select a repository to view its architectural overview.
        </div>
      ) : loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading architectural models and endpoint mappings...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Visual Architecture Topology Diagram */}
          <ArchitectureDiagram
            nodes={overview?.diagram?.nodes}
            edges={overview?.diagram?.edges}
            primaryLanguage={repoDetail?.primary_language}
          />

          {/* Project Summary & Core Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Project Summary</span>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {overview?.project_summary || repoDetail?.description || 'Modular production codebase.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                {overview?.technology_stack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Architecture Pattern</span>
              <h3 className="text-base font-bold text-white font-mono">
                {overview?.architecture_pattern || 'Clean Modular Microservices'}
              </h3>
              <p className="text-xs text-slate-400">
                Primary Language: <strong className="text-cyan-400 font-mono">{repoDetail?.primary_language}</strong>
              </p>
              <p className="text-xs text-slate-400">
                Indexed Code Chunks: <strong className="text-slate-200 font-mono">{repoDetail?.chunk_count}</strong>
              </p>
            </div>
          </div>

          {/* Endpoints & Database Models Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discovered API Endpoints */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Discovered API Endpoints ({overview?.api_endpoints.length || 0})</span>
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(!overview?.api_endpoints || overview.api_endpoints.length === 0) ? (
                  <p className="text-xs text-slate-400">No HTTP endpoints mapped.</p>
                ) : (
                  overview.api_endpoints.map((ep, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ep.method === 'GET'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : ep.method === 'POST'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-slate-200 font-semibold">{ep.path}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{ep.file}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Database Models & Entities */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Database Models & Entities ({overview?.database_models.length || 0})</span>
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(!overview?.database_models || overview.database_models.length === 0) ? (
                  <p className="text-xs text-slate-400">No database entity classes detected.</p>
                ) : (
                  overview.database_models.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-200 font-bold">{m.name}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[180px]">{m.file}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Authentication Flow & Complex Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Authentication & Authorization Flow</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {overview?.authentication_flow.map((flow, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-mono bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{flow}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Potentially Complex Areas</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {overview?.potentially_complex_areas.map((area, idx) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">⚠</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
