import React, { useState, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  FileCode,
  Copy,
  Check,
  ShieldAlert,
  ListOrdered,
  ArrowRight,
  Layers,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FileTreeItem, CodeExplanation } from '../types';

export const ExplainerPage: React.FC = () => {
  const { selectedRepo } = useAuth();
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [startLine, setStartLine] = useState<number>(1);
  const [endLine, setEndLine] = useState<number>(60);
  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedRepo) {
      api.getRepositoryFiles(selectedRepo.id).then((fileList) => {
        setFiles(fileList);
        if (fileList.length > 0) {
          const first = fileList[0];
          setSelectedFilePath(first.file_path);
          loadFileSnippet(first.file_path);
        }
      }).catch(console.error);
    }
  }, [selectedRepo]);

  const loadFileSnippet = async (path: string) => {
    if (!selectedRepo) return;
    try {
      const fileData = await api.getFileContent(selectedRepo.id, path);
      setCodeSnippet(fileData.raw_content || '');
      setEndLine(fileData.line_count || 50);
    } catch (err) {
      console.error('Failed to load file content:', err);
    }
  };

  const handleExplain = async () => {
    if (!selectedRepo || !selectedFilePath) return;

    setLoading(true);
    try {
      const result = await api.explainCode({
        repository_id: selectedRepo.id,
        file_path: selectedFilePath,
        code_snippet: codeSnippet,
        start_line: startLine,
        end_line: endLine,
      });
      setExplanation(result);
    } catch (err) {
      console.error('Explanation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation.full_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-6 h-6 text-cyan-400" />
            <span>Code Explainer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep AST-level decomposition of functions, classes, and logic blocks with edge cases and pitfalls.
          </p>
        </div>

        {explanation && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Explanation'}</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Target File & Code Block</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select File</label>
              <select
                value={selectedFilePath}
                onChange={(e) => {
                  setSelectedFilePath(e.target.value);
                  loadFileSnippet(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.file_path}>
                    {f.file_path} ({f.language})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Start Line</label>
                <input
                  type="number"
                  min={1}
                  value={startLine}
                  onChange={(e) => setStartLine(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">End Line</label>
                <input
                  type="number"
                  min={1}
                  value={endLine}
                  onChange={(e) => setEndLine(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Code Snippet Preview</label>
              <textarea
                rows={12}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-none select-text"
              />
            </div>

            <button
              onClick={handleExplain}
              disabled={loading || !selectedFilePath}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Deconstructing AST & Logic...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Code Block</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Explanation */}
        <div className="lg:col-span-7">
          {!explanation ? (
            <div className="h-full glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <Cpu className="w-12 h-12 text-slate-600" />
              <h3 className="text-base font-bold text-white">Select Code & Click Explain</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                CodeV will parse inputs, return types, dependencies, execution logic, edge cases, and security considerations.
              </p>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Summary */}
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Overview</span>
                <h3 className="text-sm font-bold text-white mt-1">{explanation.summary}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{explanation.file_path}</p>
              </div>

              {/* Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Inputs & Parameters</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {explanation.inputs.map((inp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-mono">›</span>
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Outputs & Return Types</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {explanation.outputs.map((out, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-mono">›</span>
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Execution Logic */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <span>Important Logic & Execution Flow</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  {explanation.important_logic.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-mono text-cyan-400 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge Cases & Potential Issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Edge Cases</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {explanation.edge_cases.map((ec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400">⚠</span>
                        <span>{ec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Potential Issues & Pitfalls</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {explanation.potential_issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400">✕</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
