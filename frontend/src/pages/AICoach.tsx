import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  Mic, MessageSquare, Users, Send, RotateCcw,
  ChevronDown, Sparkles, Trophy, AlertCircle
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type Mode = 'interview' | 'debate' | 'group_discussion';
type Message = { role: 'user' | 'assistant'; content: string };

interface ModeConfig {
  key: Mode;
  label: string;
  icon: React.FC<any>;
  color: string;
  persona: string;
  description: string;
  placeholder: string;
  topicSuggestions: string[];
}

// ── Mode configuration ─────────────────────────────────────────────────────
const MODES: ModeConfig[] = [
  {
    key: 'interview',
    label: 'Mock Interview',
    icon: Mic,
    color: 'from-brand-600 to-brand-400',
    persona: 'Alex — Senior Interviewer',
    description: 'Face a realistic technical or HR interview. Alex asks one question at a time, gives feedback, and adapts based on your answers.',
    placeholder: 'Type your answer...',
    topicSuggestions: ['Arrays & Strings', 'System Design', 'HR Round', 'Behavioural (STAR)', 'OS & Networks', 'DBMS']
  },
  {
    key: 'debate',
    label: 'Debate Practice',
    icon: MessageSquare,
    color: 'from-purple-600 to-pink-500',
    persona: 'Jordan — Expert Debater',
    description: 'Jordan always takes the opposing side. Build your argument skills, get scored on clarity, logic and evidence after each point.',
    placeholder: 'State your argument...',
    topicSuggestions: ['AI will replace programmers', 'Remote work is better', 'Social media does more harm', 'Nuclear energy is the future', 'Coding bootcamps vs degrees', 'Open source vs proprietary']
  },
  {
    key: 'group_discussion',
    label: 'Group Discussion',
    icon: Users,
    color: 'from-cyan-600 to-teal-400',
    persona: 'Riya · Dev · Priya + Coach',
    description: 'Simulate a real GD with 3 AI participants. Get private coaching tips every few exchanges. End with a full evaluation.',
    placeholder: 'Share your view...',
    topicSuggestions: ['Climate change & tech responsibility', 'Reservation in private sector', 'Brain drain from India', 'Startup culture vs MNC stability', 'Social media & youth', 'Universal Basic Income']
  }
];

const ROLES = ['SDE-1', 'SDE-2', 'Intern', 'Product Manager', 'Data Analyst'];

// ── Markdown-lite renderer ─────────────────────────────────────────────────
function renderText(text: string) {
  // Bold **text**, inline code `code`, coach tips, scores
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[COACH TIP:[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-navy-700 px-1 rounded text-cyan-300 text-xs font-mono">{part.slice(1, -1)}</code>;
    if (part.startsWith('[COACH TIP:'))
      return (
        <span key={i} className="block mt-2 px-3 py-2 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-300 text-xs">
          💡 {part.slice(11, -1).trim()}
        </span>
      );
    return <span key={i}>{part}</span>;
  });
}

// ── Message bubble ─────────────────────────────────────────────────────────
function Bubble({ msg, mode }: { msg: Message; mode: Mode }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
        isUser ? 'bg-brand-600 text-white' : 'bg-navy-700 text-slate-300'
      }`}>
        {isUser ? 'You' : mode === 'interview' ? 'A' : mode === 'debate' ? 'J' : 'GD'}
      </div>
      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-brand-600/25 border border-brand-600/40 text-slate-100 rounded-tr-sm'
          : 'bg-navy-800 border border-navy-700 text-slate-200 rounded-tl-sm'
      }`}>
        {renderText(msg.content)}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export const AICoach = () => {
  const [mode, setMode] = useState<Mode>('interview');
  const [topic, setTopic] = useState('');
  const [role, setRole] = useState('SDE-1');
  const [lang, setLang] = useState('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState('');
  const [exchangeCount, setExchangeCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const cfg = MODES.find(m => m.key === mode)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start session — send an opening system message
  const startSession = async () => {
    setError('');
    setMessages([]);
    setExchangeCount(0);
    setSessionActive(true);
    setLoading(true);
    try {
      const res = await api.askCommunicationCoach({
        mode,
        topic: topic || cfg.topicSuggestions[0],
        user_message: `Start the ${mode.replace('_', ' ')} session on the topic: "${topic || cfg.topicSuggestions[0]}". Introduce yourself briefly and begin.`,
        history: [],
        role,
        preferred_language: lang
      });
      setMessages([{ role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
      setSessionActive(false);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setError('');
    setExchangeCount(c => c + 1);

    try {
      const res = await api.askCommunicationCoach({
        mode,
        topic: topic || cfg.topicSuggestions[0],
        user_message: userMsg,
        // pass history minus the last user msg (already sent as user_message)
        history: newMessages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        role,
        preferred_language: lang
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setError(e.message || 'Failed to get response');
    }
    setLoading(false);
  };

  const endSession = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.askCommunicationCoach({
        mode,
        topic: topic || cfg.topicSuggestions[0],
        user_message: 'end session — please give me a detailed final evaluation and performance summary.',
        history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        role,
        preferred_language: lang
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setError(e.message || 'Failed to get evaluation');
    }
    setLoading(false);
    setSessionActive(false);
  };

  const reset = () => {
    setSessionActive(false);
    setMessages([]);
    setInput('');
    setError('');
    setExchangeCount(0);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Communication Coach</h1>
          <p className="text-slate-400 text-sm">Practice interviews, debates & group discussions with AI personas</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button key={m.key} onClick={() => { setMode(m.key); reset(); }}
              disabled={sessionActive}
              className={`p-4 rounded-xl border text-left transition-all ${
                active
                  ? `bg-gradient-to-br ${m.color} border-transparent text-white shadow-lg scale-[1.02]`
                  : 'bg-navy-800 border-navy-700 text-slate-300 hover:border-brand-500/50 disabled:opacity-50'
              }`}>
              <Icon className="w-5 h-5 mb-2" />
              <div className="font-semibold text-sm">{m.label}</div>
              <div className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-slate-500'}`}>{m.persona}</div>
            </button>
          );
        })}
      </div>

      {/* Config panel — shown before session starts */}
      {!sessionActive && messages.length === 0 && (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 space-y-5">
          <p className="text-slate-300 text-sm">{cfg.description}</p>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Topic / Focus Area</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={`e.g. ${cfg.topicSuggestions[0]}`}
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {cfg.topicSuggestions.map(s => (
                <button key={s} onClick={() => setTopic(s)}
                  className="text-xs px-2.5 py-1 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded-full text-slate-300 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Role + Language row */}
          <div className="flex gap-4 flex-wrap">
            {mode === 'interview' && (
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-semibold text-slate-400 mb-2">Target Role</label>
                <div className="relative">
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full appearance-none bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Language</label>
              <div className="relative">
                <select value={lang} onChange={e => setLang(e.target.value)}
                  className="w-full appearance-none bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
                  <option value="english">English</option>
                  <option value="telugu">తెలుగు (Telugu)</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <button onClick={startSession}
            className={`w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r ${cfg.color} text-white hover:opacity-90 transition`}>
            Start {cfg.label} Session
          </button>
        </div>
      )}

      {/* Chat area */}
      {(sessionActive || messages.length > 0) && (
        <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden flex flex-col" style={{ height: '60vh' }}>
          {/* Chat toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${sessionActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="font-semibold">{cfg.label}</span>
              {topic && <span className="text-slate-400">— {topic}</span>}
              {exchangeCount > 0 && <span className="text-slate-500 text-xs">{exchangeCount} exchanges</span>}
            </div>
            <div className="flex gap-2">
              {sessionActive && (
                <button onClick={endSession} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 transition">
                  <Trophy className="w-3.5 h-3.5" /> End & Evaluate
                </button>
              )}
              <button onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-navy-700 border border-navy-600 text-slate-300 rounded-lg hover:bg-navy-600 transition">
                <RotateCcw className="w-3.5 h-3.5" /> New Session
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => <Bubble key={i} msg={msg} mode={mode} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-xs text-slate-300 shrink-0">
                  {mode === 'interview' ? 'A' : mode === 'debate' ? 'J' : 'GD'}
                </div>
                <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {sessionActive && (
            <div className="p-3 border-t border-navy-700 flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={cfg.placeholder + ' (Enter to send, Shift+Enter for new line)'}
                rows={2}
                className="flex-1 bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none"
              />
              <button onClick={send} disabled={loading || !input.trim()}
                className={`p-3 rounded-xl text-white bg-gradient-to-br ${cfg.color} disabled:opacity-40 hover:opacity-90 transition shrink-0`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips card */}
      {!sessionActive && messages.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: '🎤 Interview Tips', tips: ['Answer in STAR format for behavioural', 'Think aloud when solving DSA', 'Ask clarifying questions first'] },
            { title: '🗣️ Debate Tips', tips: ['Start with a clear thesis statement', 'Use data and examples', 'Acknowledge opponent then rebut'] },
            { title: '👥 GD Tips', tips: ['Initiate or summarise to stand out', 'Build on others\' points', 'Maintain eye contact, don\'t dominate'] }
          ].map(card => (
            <div key={card.title} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
              <div className="font-semibold text-sm mb-2">{card.title}</div>
              <ul className="space-y-1">
                {card.tips.map(t => (
                  <li key={t} className="text-xs text-slate-400 flex gap-1.5">
                    <span className="text-brand-400 mt-0.5">›</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
