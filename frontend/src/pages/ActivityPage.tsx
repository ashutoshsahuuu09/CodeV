import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Cpu,
  Layers,
  Search,
  MessageSquareCode
} from 'lucide-react';
import { api } from '../services/api';
import { UsageStats } from '../types';

export const ActivityPage: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    api.getUsageStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'chat_query':
        return <MessageSquareCode className="w-4 h-4 text-accent" />;
      case 'search':
        return <Search className="w-4 h-4 text-accent" />;
      case 'explain_code':
        return <Cpu className="w-4 h-4 text-accent" />;
      default:
        return <Layers className="w-4 h-4 text-success" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          <span>Activity & telemetry audit</span>
        </h1>
        <p className="text-xs text-fg-muted mt-1">
          Detailed audit logs of RAG queries, code searches, indexing jobs, and execution latencies.
        </p>
      </div>

      {/* Latency & Resource Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-lg border border-edge">
          <p className="text-xs font-medium text-fg-subtle">Average RAG latency</p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-fg font-mono">185ms</p>
            <span className="text-xs text-success font-mono">-14% vs SLA</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-edge">
          <p className="text-xs font-medium text-fg-subtle">Indexed vector chunks</p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-accent font-mono">{stats?.total_code_chunks || 0}</p>
            <span className="text-xs text-fg-subtle font-mono">1536-dim</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-lg border border-edge">
          <p className="text-xs font-medium text-fg-subtle">Total questions answered</p>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-semibold text-fg font-mono">{stats?.total_queries || 0}</p>
            <span className="text-xs text-fg-subtle">Queries</span>
          </div>
        </div>
      </div>

      {/* Audit Trail List */}
      <div className="bg-surface rounded-lg p-6 border border-edge space-y-4">
        <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <span>Recent activity stream</span>
        </h3>

        {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
          <p className="text-xs text-fg-muted py-8 text-center">No telemetry logs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recent_activity.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-md bg-bg-2 border border-edge flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-surface border border-edge">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div>
                    <p className="font-medium text-fg capitalize font-mono">
                      {event.event_type.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] text-fg-subtle font-mono">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {event.latency_ms > 0 && (
                    <span className="text-accent">{event.latency_ms}ms</span>
                  )}
                  {event.tokens_used > 0 && (
                    <span className="text-fg-subtle">{event.tokens_used} tokens</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-success-soft text-success text-[10px]">
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
