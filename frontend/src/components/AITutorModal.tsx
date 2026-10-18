import React, { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { api } from '../services/api';

export const AITutorModal = ({ isOpen, onClose, topicTitle, questionTitle,
  currentCode, currentLanguage, errorContext }: any) => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('english');

  if (!isOpen) return null;

  const send = async () => {
    if (!input.trim()) return;
    const q = input;
    setMessages(m => [...m, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const r = await api.askAITutor({
        action: 'explain_concept',
        prompt: q,
        code_context: currentCode || '',
        language: currentLanguage || 'python',
        preferred_language_mode: lang,
        error_context: errorContext || ''
      });
      setMessages(m => [...m, { role: 'ai', content: r.reply }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'ai', content: 'Error: ' + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-2xl h-[80vh] bg-navy-900 border border-navy-700 rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <span className="font-bold">AI Placement Mentor</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="text-xs bg-navy-800 border border-navy-700 rounded px-2 py-1">
              <option value="english">English</option>
              <option value="telugu">తెలుగు</option>
            </select>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-12">
              Ask me anything about {topicTitle || 'DSA'} or {questionTitle || 'this problem'}!
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-brand-600/20 border border-brand-600/30 ml-12'
                : 'bg-navy-800 border border-navy-700 mr-12'
            }`}>{m.content}</div>
          ))}
          {loading && <div className="text-slate-400 text-sm">Thinking...</div>}
        </div>
        <div className="p-3 border-t border-navy-700 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask anything..."
            className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
          <button onClick={send} disabled={loading}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};