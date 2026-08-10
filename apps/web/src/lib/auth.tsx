import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setToken } from './api';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ user: AuthUser }>('/auth/me', { public: false });
        if (!cancelled) setUser(res.user);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const onUnauthorized = () => setUser(null);
    window.addEventListener('gihm:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('gihm:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      public: true,
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
