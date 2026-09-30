import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Sparkles,
  MessageSquareCode,
  FileCode,
  Copy,
  Check,
  Code2,
  Trash2,
  ChevronRight,
  Plus,
  Shield,
  HelpCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Message, Conversation, SourceCitation } from '../types';
import { CodeViewerModal } from '../components/CodeViewerModal';

export const ChatPage: React.FC = () => {
  const { selectedRepo, repositories, setSelectedRepo } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Code Viewer Modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFilePath, setViewerFilePath] = useState('');
  const [viewerStartLine, setViewerStartLine] = useState(1);
  const [viewerEndLine, setViewerEndLine] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations for selected repository
  useEffect(() => {
    if (selectedRepo) {
      api.getConversations(selectedRepo.id).then((convs) => {
        setConversations(convs);
        if (convs.length > 0 && !currentConvId) {
          loadConversation(convs[0].id);
        } else if (convs.length === 0) {
          setMessages([]);
          setCurrentConvId(null);
        }
      }).catch(console.error);
    }
  }, [selectedRepo]);

  // Handle incoming initial prompt from navigation state (e.g. from Dashboard)
  useEffect(() => {
    if (location.state?.initialPrompt && selectedRepo && !loading) {
      const p = location.state.initialPrompt;
      window.history.replaceState({}, document.title);
      handleSendMessage(p);
    }
  }, [location.state, selectedRepo]);

  const loadConversation = async (convId: string) => {
    setCurrentConvId(convId);
    try {
      const detail = await api.getConversation(convId);
      setMessages(detail.messages);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || !selectedRepo || loading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      sources: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage({
        repository_id: selectedRepo.id,
        message: text,
        conversation_id: currentConvId || undefined,
      });

      setMessages((prev) => [...prev, response]);

      // Refresh conversations list
      const updatedConvs = await api.getConversations(selectedRepo.id);
      setConversations(updatedConvs);
      if (!currentConvId && updatedConvs.length > 0) {
        setCurrentConvId(updatedConvs[0].id);
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Error processing query**: ${err.message || 'Please verify repository indexing status.'}`,
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleOpenSource = (source: SourceCitation) => {
    setViewerFilePath(source.file_path);
    setViewerStartLine(source.start_line);
    setViewerEndLine(source.end_line);
    setViewerOpen(true);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (currentConvId === id) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const suggestedQuestions = [
    'How does authentication and JWT validation work?',
    'Where is the payment and webhook logic implemented?',
    'Explain the high-level architecture of this repository.',
    'Find all places where user permissions are checked.',
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Left Chat History Sidebar */}
      <div className="w-64 border-r border-slate-800/80 bg-slate-950/60 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-3 border-b border-slate-800/80">
            <button
              onClick={handleNewChat}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-xs font-semibold text-slate-200 hover:text-cyan-300 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Conversation</span>
            </button>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Recent Threads ({conversations.length})
            </div>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  currentConvId === conv.id
                    ? 'bg-cyan-500/15 text-cyan-200 font-medium border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="truncate mr-2">
                  <p className="truncate">{conv.title}</p>
                  <p className="text-[10px] text-slate-500">{new Date(conv.updated_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">RAG Grounded · Zero Hallucination</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {!selectedRepo ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <MessageSquareCode className="w-12 h-12 text-cyan-400/60" />
              <h3 className="text-base font-bold text-white">No Repository Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Please select or connect a GitHub repository to start asking questions about its codebase.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">
                  Ask CodeV about <span className="text-cyan-400 font-mono">{selectedRepo.name}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ask architecture questions, find where features are implemented, or debug logic. All answers include clickable source citations.
                </p>
              </div>

              {/* Suggested Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 text-xs text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-3xl rounded-2xl p-5 ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/10 border border-cyan-500/30 text-slate-100 rounded-tr-sm'
                        : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 rounded-tl-sm shadow-xl'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2 text-[11px] text-slate-400 border-b border-slate-800/60 pb-1.5">
                      <span className="font-semibold">{msg.role === 'user' ? 'You' : 'CodeV'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="hover:text-slate-200 transition-colors p-1"
                          title="Copy message"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Source Citations Pill List */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Referenced Source Files ({msg.sources.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleOpenSource(source)}
                              className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-xs font-mono transition-all text-slate-300 hover:text-cyan-300 shadow-sm"
                            >
                              <span className="text-cyan-400 font-semibold">{source.file_path}</span>
                              <span className="text-[10px] text-slate-500 group-hover:text-cyan-400/80">
                                :{source.start_line}–{source.end_line}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-300">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Scanning vector store & synthesizing source citations...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <div className="p-4 md:p-6 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-900 border border-slate-800 focus-within:border-cyan-500/50 rounded-2xl p-2 shadow-2xl transition-all"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!selectedRepo || loading}
              placeholder={
                selectedRepo
                  ? `Ask about ${selectedRepo.name} (e.g. "How does authentication work?", "Where is payment logic?")`
                  : 'Select a repository to begin asking questions...'
              }
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || !selectedRepo || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
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
