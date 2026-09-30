import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, Repository } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  currentOrg: Organization | null;
  organizations: Organization[];
  selectedRepo: Repository | null;
  repositories: Repository[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; organization_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  setSelectedRepo: (repo: Repository | null) => void;
  refreshRepositories: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('CodeV_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const me = await api.getMe();
      setUser(me);

      const orgs = await api.getOrganizations();
      setOrganizations(orgs);

      const savedOrgId = localStorage.getItem('CodeV_org_id');
      const activeOrg = orgs.find(o => o.id === savedOrgId) || orgs[0] || null;
      setCurrentOrg(activeOrg);
      if (activeOrg) {
        localStorage.setItem('CodeV_org_id', activeOrg.id);
      }

      // Fetch repos for active org
      const repos = await api.getRepositories();
      setRepositories(repos);
      if (repos.length > 0 && !selectedRepo) {
        setSelectedRepo(repos[0]);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      localStorage.removeItem('CodeV_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshRepositories = async () => {
    try {
      const repos = await api.getRepositories();
      setRepositories(repos);
      if (repos.length > 0) {
        if (!selectedRepo || !repos.some(r => r.id === selectedRepo.id)) {
          setSelectedRepo(repos[0]);
        } else {
          const updated = repos.find(r => r.id === selectedRepo.id);
          if (updated) setSelectedRepo(updated);
        }
      }
    } catch (err) {
      console.error('Failed to refresh repositories:', err);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('CodeV_token', res.access_token);
    localStorage.setItem('CodeV_org_id', res.current_organization_id);
    setUser(res.user);
    await refreshUserData();
  };

  const register = async (data: { email: string; password: string; full_name: string; organization_name?: string }) => {
    const res = await api.register(data);
    localStorage.setItem('CodeV_token', res.access_token);
    localStorage.setItem('CodeV_org_id', res.current_organization_id);
    setUser(res.user);
    await refreshUserData();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setCurrentOrg(null);
    setOrganizations([]);
    setRepositories([]);
    setSelectedRepo(null);
  };

  const switchOrganization = async (orgId: string) => {
    localStorage.setItem('CodeV_org_id', orgId);
    const org = organizations.find(o => o.id === orgId) || null;
    setCurrentOrg(org);
    await refreshRepositories();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        organizations,
        selectedRepo,
        repositories,
        loading,
        login,
        register,
        logout,
        switchOrganization,
        setSelectedRepo,
        refreshRepositories,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
