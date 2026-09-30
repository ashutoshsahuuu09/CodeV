import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({
          email,
          password,
          full_name: fullName,
          organization_name: orgName || undefined,
        });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('dev@CodeV.io');
    setPassword('CodeV2026!');
    setFullName('Lead Architect');
    setOrgName('Stripe Scale Engineering');
    setError(null);
    setSubmitting(true);
    try {
      // Try registering demo user or logging in if exists
      try {
        await register({
          email: 'dev@CodeV.io',
          password: 'CodeV2026!',
          full_name: 'Lead Architect',
          organization_name: 'Stripe Scale Engineering',
        });
      } catch (e) {
        await login('dev@CodeV.io', 'CodeV2026!');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent mb-4 text-accent-fg">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-fg tracking-tight">
          CodeV <span className="text-accent">AI</span>
        </h1>
        <p className="text-sm text-fg-muted mt-1 max-w-sm">
          The engineering memory for your company's GitHub repositories.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-surface border border-edge rounded-lg p-8">
        <div className="flex items-center justify-between mb-6 border-b border-edge pb-3">
          <h2 className="text-base font-semibold text-fg">
            {isRegister ? 'Create team account' : 'Welcome back'}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-accent hover:text-accent-strong font-medium"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-danger-soft border border-danger/30 text-danger text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ashutosh Sahu"
                  className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Organization / team name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Engineering"
                  className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1.5">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-md bg-bg border border-edge text-fg text-xs placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-md bg-accent hover:bg-accent-strong text-accent-fg font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-accent-fg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create organization & join' : 'Sign in to workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-edge">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full py-2 px-3 rounded-md bg-bg-2 hover:bg-surface-2 border border-edge text-fg-muted text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>1-click instant demo login</span>
          </button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-8 flex items-center gap-6 text-xs text-fg-subtle">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-success" />
          <span>SOC2 Type II isolation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-warning" />
          <span>Zero secret retention</span>
        </div>
      </div>
    </div>
  );
};
