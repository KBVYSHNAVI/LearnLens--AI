import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, n: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      // Token invalid or backend unreachable — clear it
      localStorage.removeItem('learnlens_token');
      setUser(null);
    }
  };

  useEffect(() => {
    const t = localStorage.getItem('learnlens_token');
    if (t) {
      // Add a 5-second timeout so loading never hangs forever
      const timer = setTimeout(() => {
        localStorage.removeItem('learnlens_token');
        setUser(null);
        setLoading(false);
      }, 5000);
      refresh().finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.login({ email, password });
    localStorage.setItem('learnlens_token', r.access_token);
    setUser(r.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const r = await api.register({ email, password, name });
    localStorage.setItem('learnlens_token', r.access_token);
    setUser(r.user);
  };

  const logout = () => {
    localStorage.removeItem('learnlens_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
};