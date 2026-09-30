import React, { useState, useEffect } from 'react';
import {
  Network,
  Database,
  Globe,
  ShieldCheck,
  FileCode,
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
          <Network className="w-5 h-5 text-accent" />
          <span>Repository architecture & overview</span>
        </h1>
        <p className="text-xs text-fg-muted mt-1">
          Automated architectural topology, endpoint discovery, database models, and complex boundary maps.
        </p>
      </div>

      {!selectedRepo ? (
        <div className="bg-surface p-12 rounded-lg border border-edge text-center text-xs text-fg-muted">
          Please select a repository to view its architectural overview.
        </div>
      ) : loading ? (
        <div className="bg-surface p-12 rounded-lg border border-edge text-center space-y-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-fg-muted">Loading architectural models and endpoint mappings…</p>
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
            <div className="md:col-span-2 bg-surface p-6 rounded-lg border border-edge space-y-3">
              <span className="text-[11px] font-semibold text-accent">Project summary</span>
              <p className="text-xs text-fg leading-relaxed">
                {overview?.project_summary || repoDetail?.description || 'Modular production codebase.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                {overview?.technology_stack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-bg-2 border border-edge text-xs font-mono text-fg-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-edge space-y-3">
              <span className="text-[11px] font-semibold text-fg-subtle">Architecture pattern</span>
              <h3 className="text-sm font-semibold text-fg font-mono">
                {overview?.architecture_pattern || 'Clean modular microservices'}
              </h3>
              <p className="text-xs text-fg-muted">
                Primary language: <strong className="text-accent font-mono">{repoDetail?.primary_language}</strong>
              </p>
              <p className="text-xs text-fg-muted">
                Indexed code chunks: <strong className="text-fg font-mono">{repoDetail?.chunk_count}</strong>
              </p>
            </div>
          </div>

          {/* Endpoints & Database Models Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discovered API Endpoints */}
            <div className="bg-surface p-6 rounded-lg border border-edge space-y-4">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <span>Discovered API endpoints ({overview?.api_endpoints.length || 0})</span>
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(!overview?.api_endpoints || overview.api_endpoints.length === 0) ? (
                  <p className="text-xs text-fg-muted">No HTTP endpoints mapped.</p>
                ) : (
                  overview.api_endpoints.map((ep, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-bg-2 border border-edge flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            ep.method === 'GET'
                              ? 'bg-success-soft text-success'
                              : ep.method === 'POST'
                              ? 'bg-accent-soft text-accent'
                              : 'bg-warning-soft text-warning'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-fg font-medium">{ep.path}</span>
                      </div>
                      <span className="text-[11px] text-fg-subtle truncate max-w-[150px]">{ep.file}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Database Models & Entities */}
            <div className="bg-surface p-6 rounded-lg border border-edge space-y-4">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <span>Database models & entities ({overview?.database_models.length || 0})</span>
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(!overview?.database_models || overview.database_models.length === 0) ? (
                  <p className="text-xs text-fg-muted">No database entity classes detected.</p>
                ) : (
                  overview.database_models.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-bg-2 border border-edge flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-fg font-semibold">{m.name}</span>
                      <span className="text-[11px] text-fg-subtle truncate max-w-[180px]">{m.file}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Authentication Flow & Complex Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface p-6 rounded-lg border border-edge space-y-3">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Authentication & authorization flow</span>
              </h3>
              <ul className="space-y-2 text-xs text-fg-muted">
                {overview?.authentication_flow.map((flow, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-mono bg-bg-2 px-3 py-2 rounded-md border border-edge">
                    <FileCode className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{flow}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-edge space-y-3">
              <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Potentially complex areas</span>
              </h3>
              <ul className="space-y-2 text-xs text-fg-muted">
                {overview?.potentially_complex_areas.map((area, idx) => (
                  <li key={idx} className="p-2.5 rounded-md bg-warning-soft flex items-start gap-2">
                    <span className="text-warning mt-0.5">⚠</span>
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
