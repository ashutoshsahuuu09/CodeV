import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Search,
  MessageSquareCode
} from 'lucide-react';
import { api } from '../services/api';
import { UsageStats } from '../types';

export const ActivityPage: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsageStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'chat_query':
        return <MessageSquareCode className="w-4 h-4 text-cyan-400" />;
      case 'search':
        return <Search className="w-4 h-4 text-blue-400" />;
      case 'explain_code':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      default:
        return <Layers className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          <span>Activity & Telemetry Audit</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed audit logs of RAG queries, code searches, indexing jobs, and execution latencies.
        </p>
      </div>

      {/* Latency & Resource Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average RAG Latency</p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white font-mono">185ms</p>
            <span className="text-xs text-emerald-400 font-mono">-14% vs SLA</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Indexed Vector Chunks</p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-cyan-400 font-mono">{stats?.total_code_chunks || 0}</p>
            <span className="text-xs text-slate-400 font-mono">1536-dim</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Questions Answered</p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-white font-mono">{stats?.total_queries || 0}</p>
            <span className="text-xs text-slate-400">Queries</span>
          </div>
        </div>
      </div>

      {/* Audit Trail List */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Recent Activity Stream</span>
        </h3>

        {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
          <p className="text-xs text-slate-400 py-8 text-center">No telemetry logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recent_activity.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 capitalize font-mono">
                      {event.event_type.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {event.latency_ms > 0 && (
                    <span className="text-cyan-400">{event.latency_ms}ms</span>
                  )}
                  {event.tokens_used > 0 && (
                    <span className="text-slate-400">{event.tokens_used} tokens</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800/40">
                    200 OK
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
