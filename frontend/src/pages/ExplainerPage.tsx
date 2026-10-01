import React, { useState, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  FileCode,
  Copy,
  Check,
  ShieldAlert,
  ListOrdered,
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-accent" />
            <span>Code explainer</span>
          </h1>
          <p className="text-xs text-fg-muted mt-1">
            Deep AST-level decomposition of functions, classes, and logic blocks with edge cases and pitfalls.
          </p>
        </div>

        {explanation && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface border border-edge hover:border-edge-2 text-fg-muted hover:text-fg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied markdown' : 'Copy explanation'}</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface p-5 rounded-lg border border-edge space-y-4">
            <h3 className="text-xs font-semibold text-fg flex items-center gap-2">
              <FileCode className="w-4 h-4 text-accent" />
              <span>Target file & code block</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-fg-subtle mb-1.5">Select file</label>
              <select
                value={selectedFilePath}
                onChange={(e) => {
                  setSelectedFilePath(e.target.value);
                  loadFileSnippet(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-md bg-bg border border-edge text-fg text-xs font-mono focus:outline-none focus:border-accent"
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
                <label className="block text-xs font-medium text-fg-subtle mb-1.5">Start line</label>
                <input
                  type="number"
                  min={1}
                  value={startLine}
                  onChange={(e) => setStartLine(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-md bg-bg border border-edge text-fg text-xs font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-subtle mb-1.5">End line</label>
                <input
                  type="number"
                  min={1}
                  value={endLine}
                  onChange={(e) => setEndLine(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-md bg-bg border border-edge text-fg text-xs font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-fg-subtle mb-1.5">Code snippet preview</label>
              <textarea
                rows={12}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full p-3 rounded-md bg-bg border border-edge text-fg text-xs font-mono leading-relaxed focus:outline-none focus:border-accent resize-none select-text"
              />
            </div>

            <button
              onClick={handleExplain}
              disabled={loading || !selectedFilePath}
              className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Deconstructing AST & logic…</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain code block</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Explanation */}
        <div className="lg:col-span-7">
          {!explanation ? (
            <div className="h-full bg-surface p-12 rounded-lg border border-edge flex flex-col items-center justify-center text-center space-y-3">
              <Cpu className="w-10 h-10 text-fg-subtle" />
              <h3 className="text-sm font-semibold text-fg">Select code & click explain</h3>
              <p className="text-xs text-fg-muted max-w-sm">
                CodeV will parse inputs, return types, dependencies, execution logic, edge cases, and security considerations.
              </p>
            </div>
          ) : (
            <div className="bg-surface p-6 rounded-lg border border-edge space-y-6">
              {/* Summary */}
              <div>
                <span className="text-[11px] font-semibold text-accent">Overview</span>
                <h3 className="text-sm font-semibold text-fg mt-1">{explanation.summary}</h3>
                <p className="text-xs text-fg-subtle font-mono mt-0.5">{explanation.file_path}</p>
              </div>

              {/* Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-2 p-4 rounded-md border border-edge">
                  <h4 className="text-xs font-semibold text-fg mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span>Inputs & parameters</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-fg-muted">
                    {explanation.inputs.map((inp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-accent font-mono">›</span>
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-bg-2 p-4 rounded-md border border-edge">
                  <h4 className="text-xs font-semibold text-fg mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span>Outputs & return types</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-fg-muted">
                    {explanation.outputs.map((out, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-success font-mono">›</span>
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Execution Logic */}
              <div className="bg-bg-2 p-4 rounded-md border border-edge">
                <h4 className="text-xs font-semibold text-fg mb-2 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-accent" />
                  <span>Important logic & execution flow</span>
                </h4>
                <div className="space-y-2 text-xs text-fg-muted">
                  {explanation.important_logic.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface border border-edge flex items-center justify-center text-[10px] font-mono text-accent shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge Cases & Potential Issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-2 p-4 rounded-md border border-edge">
                  <h4 className="text-xs font-semibold text-warning mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Edge cases</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-fg-muted">
                    {explanation.edge_cases.map((ec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-warning">⚠</span>
                        <span>{ec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-bg-2 p-4 rounded-md border border-edge">
                  <h4 className="text-xs font-semibold text-danger mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Potential issues & pitfalls</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-fg-muted">
                    {explanation.potential_issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-danger">✕</span>
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
