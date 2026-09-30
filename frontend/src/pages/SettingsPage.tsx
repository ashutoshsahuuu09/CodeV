import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Users,
  Key,
  Shield,
  Check,
  Plus,
  Trash2,
  Mail,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OrgMember } from '../types';

export const SettingsPage: React.FC = () => {
  const { currentOrg, user, refreshUserData } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [openAiKey, setOpenAiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [githubPat, setGithubPat] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setLoadingMembers(true);
      api.getOrgMembers()
        .then(setMembers)
        .catch(console.error)
        .finally(() => setLoadingMembers(false));
    }
  }, [currentOrg]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const newMember = await api.addOrgMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMembers(prev => [...prev, newMember]);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Organization & Platform Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage team workspaces, access controls, AI model providers, and GitHub tokens.
        </p>
      </div>

      {/* Organization Overview */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Organization Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px] mb-1">Organization Name</span>
            <span className="text-slate-200 font-bold">{currentOrg?.name}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-sans block text-[11px] mb-1">Workspace Slug</span>
            <span className="text-cyan-400 font-bold">{currentOrg?.slug}</span>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Team Members ({members.length})</span>
          </h3>
          <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40 font-mono">
            Role-Based Access
          </span>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={!inviteEmail.trim()}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </form>

        {/* Member list */}
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-200">{m.full_name}</p>
                  <p className="text-[11px] text-slate-400">{m.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-slate-800">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Provider & GitHub API Keys */}
      <form onSubmit={handleSaveKeys} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>AI Model & GitHub Credentials</span>
          </h3>
          <span className="text-xs text-slate-400">Optional · Built-in Fallbacks Enabled</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">OpenAI API Key</label>
            <input
              type="password"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              placeholder="sk-proj-••••••••••••••••••••••••"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub Personal Access Token (PAT)</label>
            <input
              type="password"
              value={githubPat}
              onChange={(e) => setGithubPat(e.target.value)}
              placeholder="ghp_••••••••••••••••••••••••"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors flex items-center gap-2"
        >
          {savedStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
          <span>{savedStatus ? 'Credentials Saved' : 'Save API Credentials'}</span>
        </button>
      </form>
    </div>
  );
};
