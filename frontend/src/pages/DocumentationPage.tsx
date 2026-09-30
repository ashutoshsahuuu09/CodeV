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
  Layers,
  Code2
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
    { id: 'api_docs', label: 'API Reference', icon: Terminal, desc: 'REST endpoint specification with schemas and parameters.' },
    { id: 'architecture', label: 'Architecture Guide', icon: Cpu, desc: 'System design, subsystem boundaries, and Mermaid topology.' },
    { id: 'onboarding', label: 'Developer Onboarding', icon: BookOpen, desc: 'Quickstart guide for new engineers joining the team.' },
    { id: 'module', label: 'Module Breakdown', icon: Layers, desc: 'In-depth documentation of core service modules.' },
  ];

  useEffect(() => {
    if (selectedRepo) {
      api.getRepositoryDocs(selectedRepo.id).then((docs) => {
        setSavedDocs(docs);
        const match = docs.find(d => d.doc_type === selectedDocType);
        if (match) {
          setCurrentDoc(match);
        } else {
          // Auto generate if none exists yet
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
      // update list
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Documentation Generator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated production documentation generated from AST parsed source code.
          </p>
        </div>

        {currentDoc && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
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
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-2 text-cyan-400" />
              <p className="text-xs font-bold text-slate-100">{dt.label}</p>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{dt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Generator Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Generation Settings</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Custom Instructions (Optional)
              </label>
              <textarea
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Highlight PostgreSQL migration steps and Stripe test credentials format..."
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !selectedRepo}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Generating {selectedDocType}...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Regenerate Document</span>
                </>
              )}
            </button>

            {currentDoc && (
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
                <span>Version: v{currentDoc.version}</span>
                <span>Updated: {new Date(currentDoc.updated_at).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Markdown Viewer */}
        <div className="lg:col-span-8">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[550px]">
            <div className="h-12 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">
                {currentDoc ? currentDoc.title : 'Document Preview'}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                Markdown
              </span>
            </div>

            <div className="flex-1 p-6 bg-slate-950/60 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-text whitespace-pre-wrap">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing repository documentation...</span>
                </div>
              ) : currentDoc ? (
                currentDoc.content
              ) : (
                <div className="py-20 text-center text-slate-500">
                  No document generated yet. Click Generate above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
