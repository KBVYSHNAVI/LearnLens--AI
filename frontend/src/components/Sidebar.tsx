import React from 'react';
import { Home, BookOpen, Code2, Mic, Building2, User, X, MessageSquare } from 'lucide-react';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'paths', label: 'Learning Paths', icon: BookOpen },
  { key: 'coding', label: 'Coding Arena', icon: Code2 },
  { key: 'ai-coach', label: 'AI Coach', icon: MessageSquare },
  { key: 'mock-interview', label: 'Mock Interview', icon: Mic },
  { key: 'company-tracks', label: 'Company Tracks', icon: Building2 },
  { key: 'profile', label: 'Profile', icon: User }
];

export const Sidebar = ({ currentTab, onSelectTab, collapsed, mobileOpen, onCloseMobile }: any) => {
  const inner = (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 bg-navy-900 border-r border-navy-700 min-h-[calc(100vh-57px)] p-3 transition-all`}>
      <div className="flex flex-col gap-1">
        {items.map(it => {
          const Icon = it.icon;
          const active = currentTab === it.key;
          return (
            <button key={it.key} onClick={() => { onSelectTab(it.key); onCloseMobile?.(); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{it.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{inner}</div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={onCloseMobile} />
          <div className="w-60 bg-navy-900">
            <div className="flex justify-end p-2">
              <button onClick={onCloseMobile}><X className="w-5 h-5" /></button>
            </div>
            {inner}
          </div>
        </div>
      )}
    </>
  );
};