import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Sparkles, FileCode, Shield } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/50">
      <div className="w-full max-w-5xl h-[85vh] bg-surface border border-edge rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-14 px-6 border-b border-edge bg-bg-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-accent-soft border border-accent-soft-edge flex items-center justify-center text-accent">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-fg">{filePath}</span>
              {startLine && endLine && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-mark-soft text-mark-fg">
                  Lines {startLine}–{endLine}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExplain && (
              <button
                onClick={() => {
                  onExplain(filePath, startLine, endLine, getTargetSnippet());
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-fg hover:bg-accent-strong text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain code</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-bg-2 border border-edge text-fg-muted text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface-2 text-fg-subtle hover:text-fg transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto bg-bg font-mono text-xs p-4 select-text">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-fg-muted">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching source code from indexed repository…</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-danger">
              <p className="font-semibold">Unable to display file</p>
              <p className="text-fg-muted text-xs">{error}</p>
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
                        ? 'bg-mark-soft border-l-2 border-mark text-mark-fg font-medium'
                        : 'hover:bg-bg-2 text-fg-muted'
                    }`}
                  >
                    <span
                      className={`w-12 shrink-0 select-none text-right pr-4 text-[11px] ${
                        isHighlighted ? 'text-mark font-semibold' : 'text-fg-subtle'
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
        <div className="h-9 px-6 border-t border-edge bg-bg-2 flex items-center justify-between text-[11px] text-fg-subtle shrink-0">
          <div className="flex items-center gap-3">
            <span>Language: <strong className="text-fg-muted font-mono">{fileData?.language || 'Code'}</strong></span>
            <span>·</span>
            <span>Total lines: <strong className="text-fg-muted font-mono">{lines.length}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-fg-subtle">
            <Shield className="w-3.5 h-3.5 text-success" />
            <span>Encrypted repo ingestion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
