import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  BookOpen,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GeneratedDocument } from '../types';

export const DocumentationPage: React.FC = () => {
  const { selectedRepo } = useAuth();
  const [selectedDocType, setSelectedDocType] = useState('readme');
  const [customInstructions, setCustomInstructions] = useState('');
  const [currentDoc, setCurrentDoc] = useState<GeneratedDocument | null>(null);
  const [savedDocs, setSavedDocs] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const docTypes = [
    { id: 'readme', label: 'README.md', icon: FileText, desc: 'Complete repository README with setup and architecture overview.' },
    { id: 'api_docs', label: 'API reference', icon: Terminal, desc: 'REST endpoint specification with schemas and parameters.' },
    { id: 'architecture', label: 'Architecture guide', icon: Cpu, desc: 'System design, subsystem boundaries, and Mermaid topology.' },
    { id: 'onboarding', label: 'Developer onboarding', icon: BookOpen, desc: 'Quickstart guide for new engineers joining the team.' },
    { id: 'module', label: 'Module breakdown', icon: Layers, desc: 'In-depth documentation of core service modules.' },
  ];

  useEffect(() => {
    if (selectedRepo) {
      api.getRepositoryDocs(selectedRepo.id).then((docs) => {
        setSavedDocs(docs);
        const match = docs.find(d => d.doc_type === selectedDocType);
        if (match) {
          setCurrentDoc(match);
        } else {
          handleGenerate(selectedDocType);
        }
      }).catch(console.error);
    }
  }, [selectedRepo, selectedDocType]);

  const handleGenerate = async (typeToGen?: string) => {
    const docType = typeToGen || selectedDocType;
    if (!selectedRepo) return;

    setLoading(true);
    try {
      const doc = await api.generateDocumentation({
        repository_id: selectedRepo.id,
        doc_type: docType,
        custom_instructions: customInstructions || undefined,
      });
      setCurrentDoc(doc);
      const allDocs = await api.getRepositoryDocs(selectedRepo.id);
      setSavedDocs(allDocs);
    } catch (err) {
      console.error('Doc generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (currentDoc) {
      navigator.clipboard.writeText(currentDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!currentDoc) return;
    const blob = new Blob([currentDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.doc_type}_${selectedRepo?.name || 'docs'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            <span>Documentation generator</span>
          </h1>
          <p className="text-xs text-fg-muted mt-1">
            Automated production documentation generated from AST parsed source code.
          </p>
        </div>

        {currentDoc && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface border border-edge hover:border-edge-2 text-fg-muted hover:text-fg text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent hover:bg-accent-strong text-accent-fg text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
            </button>
          </div>
        )}
      </div>

      {/* Doc Types Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {docTypes.map((dt) => {
          const Icon = dt.icon;
          const isActive = selectedDocType === dt.id;
          return (
            <button
              key={dt.id}
              onClick={() => setSelectedDocType(dt.id)}
              className={`p-3.5 rounded-lg border text-left transition-colors ${
                isActive
                  ? 'bg-accent-soft border-accent-soft-edge text-accent'
                  : 'bg-surface border-edge hover:border-edge-2 text-fg-muted hover:text-fg'
              }`}
            >
              <Icon className="w-4 h-4 mb-2 text-accent" />
              <p className="text-xs font-semibold text-fg">{dt.label}</p>
              <p className="text-[10px] text-fg-subtle line-clamp-1 mt-0.5">{dt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Generator Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface p-5 rounded-lg border border-edge space-y-4">
            <h3 className="text-xs font-semibold text-fg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Generation settings</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-fg-subtle mb-1.5">
                Custom instructions (optional)
              </label>
              <textarea
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Highlight PostgreSQL migration steps and Stripe test credentials format…"
                className="w-full p-2.5 rounded-md bg-bg border border-edge text-fg text-xs focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !selectedRepo}
              className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Generating {selectedDocType}…</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Regenerate document</span>
                </>
              )}
            </button>

            {currentDoc && (
              <div className="pt-3 border-t border-edge text-[11px] text-fg-subtle flex justify-between">
                <span>Version: v{currentDoc.version}</span>
                <span>Updated: {new Date(currentDoc.updated_at).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Markdown Viewer */}
        <div className="lg:col-span-8">
          <div className="bg-surface rounded-lg border border-edge overflow-hidden flex flex-col min-h-[550px]">
            <div className="h-12 px-6 border-b border-edge bg-bg-2 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-fg">
                {currentDoc ? currentDoc.title : 'Document preview'}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface text-accent border border-edge">
                Markdown
              </span>
            </div>

            <div className="flex-1 p-6 bg-bg overflow-y-auto font-mono text-xs text-fg leading-relaxed select-text whitespace-pre-wrap">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-fg-muted py-20">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing repository documentation…</span>
                </div>
              ) : currentDoc ? (
                currentDoc.content
              ) : (
                <div className="py-20 text-center text-fg-subtle">
                  No document generated yet. Click generate above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
