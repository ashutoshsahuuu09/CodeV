import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, ExternalLink, Code2, Sparkles, FileCode, Shield } from 'lucide-react';
import { api } from '../services/api';
import { FileContent } from '../types';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: string;
  filePath: string;
  startLine?: number;
  endLine?: number;
  onExplain?: (filePath: string, startLine?: number, endLine?: number, snippet?: string) => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  onClose,
  repositoryId,
  filePath,
  startLine = 1,
  endLine = 1,
  onExplain,
}) => {
  const [fileData, setFileData] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const highlightedLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !repositoryId || !filePath) return;

    setLoading(true);
    setError(null);

    api.getFileContent(repositoryId, filePath)
      .then((data) => {
        setFileData(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load file content');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, repositoryId, filePath]);

  // Scroll to highlighted line on load
  useEffect(() => {
    if (!loading && highlightedLineRef.current) {
      highlightedLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, startLine]);

  if (!isOpen) return null;

  const lines = fileData?.raw_content ? fileData.raw_content.split('\n') : [];

  const handleCopy = () => {
    if (fileData?.raw_content) {
      navigator.clipboard.writeText(fileData.raw_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTargetSnippet = () => {
    if (!lines.length) return '';
    const s = Math.max(0, startLine - 1);
    const e = Math.min(lines.length, endLine);
    return lines.slice(s, e).join('\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-100">{filePath}</span>
                {startLine && endLine && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Lines {startLine}–{endLine}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExplain && (
              <button
                onClick={() => {
                  onExplain(filePath, startLine, endLine, getTargetSnippet());
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-semibold transition-all shadow-md shadow-cyan-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain Code</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs p-4 select-text">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching source code from indexed repository...</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-rose-400">
              <p className="font-semibold">Unable to display file</p>
              <p className="text-slate-400 text-xs">{error}</p>
            </div>
          ) : (
            <div className="min-w-full">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = startLine && endLine && lineNum >= startLine && lineNum <= endLine;
                const isFirstHighlight = isHighlighted && lineNum === startLine;

                return (
                  <div
                    key={lineNum}
                    ref={isFirstHighlight ? highlightedLineRef : null}
                    className={`flex items-start group py-0.5 px-2 rounded ${
                      isHighlighted
                        ? 'bg-cyan-500/15 border-l-2 border-cyan-400 text-cyan-100 font-medium'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-12 shrink-0 select-none text-right pr-4 text-[11px] ${
                        isHighlighted ? 'text-cyan-400 font-bold' : 'text-slate-600 group-hover:text-slate-500'
                      }`}
                    >
                      {lineNum}
                    </span>
                    <pre className="flex-1 whitespace-pre font-mono overflow-x-auto text-[12px] leading-relaxed">
                      {line || ' '}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-9 px-6 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>Language: <strong className="text-slate-300 font-mono">{fileData?.language || 'Code'}</strong></span>
            <span>·</span>
            <span>Total Lines: <strong className="text-slate-300 font-mono">{lines.length}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Repo Ingestion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
