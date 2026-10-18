import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }: any) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // sync when defaultMode changes (e.g. clicking "Get Started" vs "Sign In")
  React.useEffect(() => { setMode(defaultMode); }, [defaultMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setErr(''); setEmail(''); setPassword(''); setName('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (mode === 'register' && name.trim().length < 2) {
      setErr('Name must be at least 2 characters'); return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters'); return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        // Try admin login first — if it succeeds, store token and reload into admin panel
        try {
          const res = await api.adminLogin(email, password);
          localStorage.setItem('learnlens_admin_token', res.access_token);
          localStorage.setItem('learnlens_token', res.access_token);
          window.location.reload();
          return;
        } catch {
          // Not an admin — fall through to regular user login
        }
        await login(email, password);
      } else {
        await register(email, password, name.trim());
      }
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600/20 to-cyan-600/10 px-6 pt-6 pb-4 border-b border-navy-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span className="font-bold text-brand-400 text-sm tracking-wide">LearnLens AI</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-700 transition">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <h2 className="text-2xl font-bold mt-3">
            {mode === 'login' ? 'Welcome back!' : 'Join LearnLens AI'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'login'
              ? 'Sign in to continue your placement prep journey'
              : 'Create your account and start cracking placements'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-6 mt-5 bg-navy-800 rounded-xl p-1 gap-1">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === m ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input required value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vyshnavi Veeresh"
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input required type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:border-brand-500 transition" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{err}
            </div>
          )}

          <button disabled={busy} type="submit"
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl py-2.5 font-bold text-sm disabled:opacity-50 transition shadow-lg">
            {busy
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <p className="text-center text-xs text-slate-500 pt-1">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-brand-400 font-semibold hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};