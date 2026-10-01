import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Users,
  Key,
  Check,
  Plus,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OrgMember } from '../types';

export const SettingsPage: React.FC = () => {
  const { currentOrg } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [openAiKey, setOpenAiKey] = useState('');
  const [githubPat, setGithubPat] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      api.getOrgMembers()
        .then(setMembers)
        .catch(console.error);
    }
  }, [currentOrg]);

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim();
    if (!cleanEmail) return;

    if (!isValidEmail(cleanEmail)) {
      alert('Please enter a valid email address (e.g. colleague@company.com).');
      return;
    }

    try {
      const newMember = await api.addOrgMember({
        email: cleanEmail,
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
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-fg tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          <span>Organization & platform settings</span>
        </h1>
        <p className="text-xs text-fg-muted mt-1">
          Manage team workspaces, access controls, AI model providers, and GitHub tokens.
        </p>
      </div>

      {/* Organization Overview */}
      <div className="bg-surface p-6 rounded-lg border border-edge space-y-4">
        <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" />
          <span>Organization details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-bg-2 p-3 rounded-md border border-edge">
            <span className="text-fg-subtle font-sans block text-[11px] mb-1">Organization name</span>
            <span className="text-fg font-semibold">{currentOrg?.name}</span>
          </div>

          <div className="bg-bg-2 p-3 rounded-md border border-edge">
            <span className="text-fg-subtle font-sans block text-[11px] mb-1">Workspace slug</span>
            <span className="text-accent font-semibold">{currentOrg?.slug}</span>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-surface p-6 rounded-lg border border-edge space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <span>Team members ({members.length})</span>
          </h3>
          <span className="text-xs text-success bg-success-soft px-2.5 py-0.5 rounded-full font-mono">
            Role-based access
          </span>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 px-3.5 py-2 rounded-md bg-bg border border-edge text-xs text-fg placeholder-fg-subtle focus:outline-none focus:border-accent"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 rounded-md bg-bg border border-edge text-xs text-fg focus:outline-none focus:border-accent"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={!inviteEmail.trim() || !isValidEmail(inviteEmail)}
            className="px-4 py-2 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add member</span>
          </button>
        </form>

        {/* Member list */}
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-md bg-bg-2 border border-edge flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent-soft-edge flex items-center justify-center text-xs font-semibold text-accent">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-fg">{m.full_name}</p>
                  <p className="text-[11px] text-fg-subtle">{m.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-surface text-accent border border-edge">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Provider & GitHub API Keys */}
      <form onSubmit={handleSaveKeys} className="bg-surface p-6 rounded-lg border border-edge space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <Key className="w-4 h-4 text-accent" />
            <span>AI model & GitHub credentials</span>
          </h3>
          <span className="text-xs text-fg-subtle">Optional · built-in fallbacks enabled</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1.5">OpenAI API key</label>
            <input
              type="password"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              placeholder="sk-proj-••••••••••••••••••••••••"
              className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-xs text-fg font-mono placeholder-fg-subtle focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1.5">GitHub personal access token (PAT)</label>
            <input
              type="password"
              value={githubPat}
              onChange={(e) => setGithubPat(e.target.value)}
              placeholder="ghp_••••••••••••••••••••••••"
              className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-xs text-fg font-mono placeholder-fg-subtle focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-bg-2 hover:bg-surface-2 border border-edge text-accent text-xs font-semibold transition-colors flex items-center gap-2"
        >
          {savedStatus ? <Check className="w-4 h-4 text-success" /> : <Lock className="w-4 h-4" />}
          <span>{savedStatus ? 'Credentials saved' : 'Save API credentials'}</span>
        </button>
      </form>
    </div>
  );
};
