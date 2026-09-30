import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileCode,
  ExternalLink,
  Code2,
  Sparkles,
  Layers,
  ArrowRight
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
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-cyan-400" />
          <span>Semantic Code Search</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Search your codebase by concepts, logic, and intent — not just exact keyword matches.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <form onSubmit={handleSearch} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 focus-within:border-cyan-500/50 rounded-xl p-2 transition-all">
          <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!selectedRepo}
            placeholder={
              selectedRepo
                ? `Search ${selectedRepo.name} concepts (e.g. "payment failure handling", "jwt verification")...`
                : 'Please select a repository first...'
            }
            className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || !selectedRepo || loading}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all shrink-0"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Filters:</span>
          </div>

          <input
            type="text"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            placeholder="Language (e.g. Python, TypeScript)"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <input
            type="text"
            value={pathFilter}
            onChange={(e) => setPathFilter(e.target.value)}
            placeholder="Path filter (e.g. api/, services/)"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Quick sample pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500">Popular queries:</span>
          {sampleSearches.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(s);
                // trigger search
                if (selectedRepo) {
                  api.searchCode({ repository_id: selectedRepo.id, query: s }).then((res) => {
                    setResults(res.results);
                    setHasSearched(true);
                  });
                }
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Computing hybrid dense embeddings and scanning chunks...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-white">No Matching Code Chunks Found</p>
            <p className="text-xs text-slate-400">Try broadening your search query or removing path filters.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Showing {results.length} ranked results</span>
              <span>Sorted by Semantic Relevance</span>
            </div>

            {results.map((item) => (
              <div
                key={item.chunk_id}
                onClick={() => openCodeViewer(item)}
                className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/80 cursor-pointer transition-all duration-150 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-100">{item.file_path}</span>
                    <span className="text-slate-500">:{item.start_line}–{item.end_line}</span>
                    {item.symbol_name && (
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800/40">
                        {item.symbol_type}: {item.symbol_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-[10px] text-slate-400">Match:</span>
                      <span className="font-bold text-emerald-400">
                        {(item.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Code Snippet Box */}
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
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
