import React from 'react';
import { Sparkles, Menu, Sun, Moon, Award, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onToggleSidebar, onOpenAITutor, onOpenAuth, darkMode, onToggleTheme }: any) => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 bg-navy-900/95 backdrop-blur border-b border-navy-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded hover:bg-navy-800">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-400" />
          <span className="font-bold text-lg tracking-tight">LearnLens AI</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onOpenAITutor}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium">
          <Sparkles className="w-4 h-4" /> AI Mentor
        </button>
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-sm">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-amber-300">{user.points || 0} pts</span>
            <span className="text-slate-500">|</span>
            <span className="text-orange-400">🔥 {user.streak_count}d</span>
          </div>
        )}
        <button onClick={onToggleTheme} className="p-2 rounded hover:bg-navy-800">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {user ? (
          <button onClick={logout} className="p-2 rounded hover:bg-navy-800" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={onOpenAuth}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium">
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};