import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SearchResultItem } from '../types';
import { CodeViewerModal } from '../components/CodeViewerModal';

export const SearchPage: React.FC = () => {
  const { selectedRepo } = useAuth();
  const [query, setQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Code Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFilePath, setViewerFilePath] = useState('');
  const [viewerStartLine, setViewerStartLine] = useState(1);
  const [viewerEndLine, setViewerEndLine] = useState(1);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || !selectedRepo) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.searchCode({
        repository_id: selectedRepo.id,
        query: query.trim(),
        language: languageFilter || undefined,
        path_filter: pathFilter || undefined,
        limit: 20,
      });
      setResults(res.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCodeViewer = (item: SearchResultItem) => {
    setViewerFilePath(item.file_path);
    setViewerStartLine(item.start_line);
    setViewerEndLine(item.end_line);
    setViewerOpen(true);
  };

  const sampleSearches = [
    'payment failure handling',
    'authenticate user jwt token',
    'database connection init',
    'stripe webhook signature verification',
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
          <Search className="w-5 h-5 text-accent" />
          <span>Semantic code search</span>
        </h1>
        <p className="text-xs text-fg-muted mt-1">
          Search your codebase by concepts, logic, and intent — not just exact keyword matches.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <form onSubmit={handleSearch} className="bg-surface p-5 rounded-lg border border-edge space-y-4">
        <div className="flex items-center gap-3 bg-bg border border-edge focus-within:border-accent rounded-md p-2 transition-colors">
          <Search className="w-4 h-4 text-fg-subtle ml-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!selectedRepo}
            placeholder={
              selectedRepo
                ? `Search ${selectedRepo.name} concepts (e.g. "payment failure handling", "jwt verification")…`
                : 'Please select a repository first…'
            }
            className="flex-1 bg-transparent px-2 py-1 text-xs text-fg placeholder-fg-subtle focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || !selectedRepo || loading}
            className="px-4 py-2 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs disabled:opacity-40 transition-colors shrink-0"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-fg-subtle" />
            <span className="text-fg-subtle font-medium">Filters:</span>
          </div>

          <input
            type="text"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            placeholder="Language (e.g. Python, TypeScript)"
            className="px-3 py-1.5 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle focus:outline-none focus:border-accent"
          />

          <input
            type="text"
            value={pathFilter}
            onChange={(e) => setPathFilter(e.target.value)}
            placeholder="Path filter (e.g. api/, services/)"
            className="px-3 py-1.5 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle focus:outline-none focus:border-accent"
          />
        </div>

        {/* Quick sample pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-edge">
          <span className="text-[11px] text-fg-subtle">Popular queries:</span>
          {sampleSearches.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(s);
                if (selectedRepo) {
                  api.searchCode({ repository_id: selectedRepo.id, query: s }).then((res) => {
                    setResults(res.results);
                    setHasSearched(true);
                  });
                }
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-bg-2 hover:bg-surface-2 text-fg-muted hover:text-fg border border-edge transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-surface p-12 rounded-lg border border-edge text-center space-y-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-fg-muted">Computing hybrid dense embeddings and scanning chunks…</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="bg-surface p-12 rounded-lg border border-edge text-center space-y-2">
            <p className="text-sm font-semibold text-fg">No matching code chunks found</p>
            <p className="text-xs text-fg-muted">Try broadening your search query or removing path filters.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-fg-subtle px-1">
              <span>Showing {results.length} ranked results</span>
              <span>Sorted by semantic relevance</span>
            </div>

            {results.map((item) => (
              <div
                key={item.chunk_id}
                onClick={() => openCodeViewer(item)}
                className="bg-surface rounded-lg p-5 border border-edge hover:border-edge-2 cursor-pointer transition-colors space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <FileCode className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-fg">{item.file_path}</span>
                    <span className="text-fg-subtle">:{item.start_line}–{item.end_line}</span>
                    {item.symbol_name && (
                      <span className="px-2 py-0.5 rounded bg-accent-soft text-accent text-[10px] border border-accent-soft-edge">
                        {item.symbol_type}: {item.symbol_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-[10px] text-fg-subtle">Match:</span>
                      <span className="font-semibold text-success">
                        {(item.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-fg-subtle" />
                  </div>
                </div>

                {/* Code Snippet Box */}
                <pre className="bg-bg p-3 rounded-md border border-edge font-mono text-xs text-fg-muted overflow-x-auto leading-relaxed">
                  {item.code_snippet}
                </pre>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Code Viewer Modal */}
      {selectedRepo && (
        <CodeViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          repositoryId={selectedRepo.id}
          filePath={viewerFilePath}
          startLine={viewerStartLine}
          endLine={viewerEndLine}
        />
      )}
    </div>
  );
};
