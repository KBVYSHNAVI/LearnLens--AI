import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck, LogOut, Plus, Pencil, Trash2, Save, X,
  ChevronDown, Users, BookOpen, AlertCircle, CheckCircle2,
  Search, BarChart2, Trophy, TrendingUp, KeyRound, MessageSquare,
  Code2, Layers, ChevronRight, ChevronUp, Eye, EyeOff, ClipboardList
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'questions' | 'paths' | 'assignments' | 'users' | 'settings';
interface Topic { id: number; path_key: string; topic_key: string; title: string; }
interface Question {
  id: number; topic_id: number; question_uid: string; title: string;
  difficulty: string; type: string; description: string; options: string;
  correct_answer: string; explanation: string; hints: string;
  starter_code_python: string; starter_code_java: string; starter_code_js: string;
  reference_solution_python: string; test_cases: string; tags: string;
  company_tags: string; verified: boolean;
}
interface UserRow { id: number; name: string; email: string; points: number; streak: number; created_at: string; }

const EMPTY_Q = {
  topic_id: 0, question_uid: '', title: '', difficulty: 'Easy', type: 'mcq',
  description: '', options: '[]', correct_answer: '', explanation: '',
  hints: '[]', starter_code_python: '', starter_code_java: '', starter_code_js: '',
  reference_solution_python: '', test_cases: '[]', tags: '[]', company_tags: '[]'
};

const diffColor: Record<string, string> = {
  Easy: 'bg-green-500/20 text-green-400',
  Medium: 'bg-amber-500/20 text-amber-400',
  Hard: 'bg-red-500/20 text-red-400',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const Pill = ({ text, color }: { text: string; color: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>
);

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm font-medium mt-0.5">{label}</div>
    {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
  </div>
);

// ── Admin Login ────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@learnlens.ai');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.adminLogin(email, password);
      localStorage.setItem('learnlens_admin_token', res.access_token);
      localStorage.setItem('learnlens_token', res.access_token);
      onLogin();
    } catch (err: any) { setError(err.message || 'Invalid credentials'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-navy-800 border border-navy-700 rounded-2xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-xl bg-brand-600/20 border border-brand-600/30">
            <ShieldCheck className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <p className="text-slate-400 text-sm text-center">LearnLens Administration</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
          </div>
          {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold text-sm transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500">admin@learnlens.ai / LearnLens@Admin2026</p>
      </div>
    </div>
  );
}

// ── Question Form ──────────────────────────────────────────────────────────
function QuestionForm({ topics, initial, onSave, onCancel }: {
  topics: Topic[]; initial: any; onSave: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_Q, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      initial.id ? await api.adminUpdateQuestion(initial.id, form)
                 : await api.adminCreateQuestion(form);
      setOk(true);
      setTimeout(() => { setOk(false); onSave(); }, 700);
    } catch (err: any) { setError(err.message || 'Save failed'); }
    setSaving(false);
  };

  const field = (label: string, key: string, ph = '') => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
      <input value={(form as any)[key]} placeholder={ph} onChange={e => set(key, e.target.value)}
        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
    </div>
  );
  const ta = (label: string, key: string, rows = 3, ph = '') => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
      <textarea value={(form as any)[key]} rows={rows} placeholder={ph} onChange={e => set(key, e.target.value)}
        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y font-mono" />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Topic *</label>
          <div className="relative">
            <select value={form.topic_id} onChange={e => set('topic_id', Number(e.target.value))} required
              className="w-full appearance-none bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
              <option value={0}>Select topic…</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
        {field('Question UID *', 'question_uid', 'e.g. arrays_findmax_001')}
      </div>
      {field('Title *', 'title', 'Find maximum element in array')}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty</label>
          <div className="relative">
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
              className="w-full appearance-none bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
              {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
          <div className="relative">
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full appearance-none bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
              <option value="mcq">MCQ</option>
              <option value="coding">Coding</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>
      {ta('Description *', 'description', 4, 'Problem statement...')}
      {form.type === 'mcq' && <>
        {ta('Options (JSON array)', 'options', 3, '["Option A", "Option B", "Option C", "Option D"]')}
        {field('Correct Answer', 'correct_answer', 'Option A')}
        {ta('Explanation', 'explanation', 2)}
      </>}
      {form.type === 'coding' && <>
        {ta('Test Cases (JSON)', 'test_cases', 4, '[{"input":"5\\n1 2 3 4 5","expected_output":"5"}]')}
        {ta('Starter Code (Python)', 'starter_code_python', 4, 'def solution(arr):\n    pass')}
        {ta('Reference Solution (Python)', 'reference_solution_python', 4)}
        {ta('Starter Code (Java)', 'starter_code_java', 3)}
        {ta('Starter Code (JS)', 'starter_code_js', 3)}
        {ta('Hints (JSON array)', 'hints', 2, '["Think O(n)", "Track running max"]')}
      </>}
      <div className="grid grid-cols-2 gap-3">
        {field('Tags (JSON)', 'tags')}
        {field('Company Tags (JSON)', 'company_tags')}
      </div>
      {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
      {ok && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"><CheckCircle2 className="w-4 h-4 shrink-0"/>Saved!</div>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold transition disabled:opacity-50">
          <Save className="w-4 h-4"/>{saving ? 'Saving...' : initial.id ? 'Update' : 'Create Question'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-sm transition">
          <X className="w-4 h-4"/>Cancel
        </button>
      </div>
    </form>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-slate-400">Failed to load analytics.</div>;

  const { totals, top_users, hot_questions, topic_stats } = data;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totals.users} color="bg-brand-600/20 text-brand-400" />
        <StatCard icon={BookOpen} label="Questions" value={totals.questions} sub={`${totals.learning_paths} paths · ${totals.topics} topics`} color="bg-cyan-600/20 text-cyan-400" />
        <StatCard icon={Code2} label="Submissions" value={totals.submissions} sub={`${totals.pass_rate}% pass rate`} color="bg-green-600/20 text-green-400" />
        <StatCard icon={Trophy} label="Quizzes Taken" value={totals.quizzes} color="bg-amber-600/20 text-amber-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top users */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-2 font-bold mb-4"><TrendingUp className="w-4 h-4 text-brand-400"/>Top Users</div>
          {top_users.length === 0 ? <p className="text-slate-500 text-sm">No users yet</p> :
            top_users.map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-brand-400 font-semibold text-sm">{u.points} pts</div>
                  <div className="text-xs text-amber-400">🔥 {u.streak}d</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Hot questions */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-2 font-bold mb-4"><BarChart2 className="w-4 h-4 text-cyan-400"/>Most Attempted</div>
          {hot_questions.length === 0 ? <p className="text-slate-500 text-sm">No submissions yet</p> :
            hot_questions.map((q: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                <div className="text-sm truncate max-w-[65%]">{q.title}</div>
                <div className="text-xs bg-navy-700 px-2 py-0.5 rounded-full text-slate-300">{q.attempts} tries</div>
              </div>
            ))
          }
        </div>

        {/* Topic completion */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-2 font-bold mb-4"><Layers className="w-4 h-4 text-purple-400"/>Topic Completions</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topic_stats.length === 0 ? <p className="text-slate-500 text-sm">No progress yet</p> :
              topic_stats.map((t: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate max-w-[70%] text-slate-300">{t.topic}</span>
                    <span className="text-slate-500">{t.completed} users · {t.questions}q</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(t.completed * 10, 100)}%` }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* What to add suggestions */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
        <div className="flex items-center gap-2 font-bold mb-4"><MessageSquare className="w-4 h-4 text-amber-400"/>Content Suggestions</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-navy-700/50 rounded-lg p-4">
            <div className="font-semibold text-brand-400 mb-2">📚 Recommended Topics to Add</div>
            <ul className="space-y-1 text-slate-400 text-xs">
              {['Sliding Window', 'Two Pointers', 'Monotonic Stack', 'Trie', 'Segment Tree', 'Bit Manipulation'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-brand-500"/>{t}</li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-700/50 rounded-lg p-4">
            <div className="font-semibold text-cyan-400 mb-2">🎯 Recommended Learning Paths</div>
            <ul className="space-y-1 text-slate-400 text-xs">
              {['FAANG Interview Track', 'System Design Basics', 'SQL & Databases', 'OS Concepts', 'Aptitude & Reasoning', 'HR & Soft Skills'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-cyan-500"/>{t}</li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-700/50 rounded-lg p-4">
            <div className="font-semibold text-purple-400 mb-2">🤝 AI Coach Topics to Add</div>
            <ul className="space-y-1 text-slate-400 text-xs">
              {['Resume walkthrough', 'Salary negotiation', 'STAR method drills', 'Technical round 2', 'Case study GD', 'Pressure interview'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-purple-500"/>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Learning Paths Tab ─────────────────────────────────────────────────────
function PathsTab() {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showPathForm, setShowPathForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState<string | null>(null);
  const [showResourceForm, setShowResourceForm] = useState<number | null>(null); // path id
  const [pathForm, setPathForm] = useState({ path_key: '', title: '', tagline: '', description: '', icon: 'book', color: 'blue', order: 10 });
  const [topicForm, setTopicForm] = useState({ topic_key: '', title: '', category: 'Core', difficulty: 'Medium', order: 10, estimated_minutes: 60, description: '' });
  const [resourceLinks, setResourceLinks] = useState<{ label: string; url: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [savingRes, setSavingRes] = useState(false);

  const load = () => { setLoading(true); api.adminGetPaths().then(setPaths).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const createPath = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.adminCreatePath(pathForm); setShowPathForm(false); setMsg('Path created!'); load(); } catch (err: any) { setMsg(err.message); }
  };

  const createTopic = async (e: React.FormEvent, path_key: string) => {
    e.preventDefault();
    try { await api.adminCreateTopic({ ...topicForm, path_key }); setShowTopicForm(null); setMsg('Topic created!'); load(); } catch (err: any) { setMsg(err.message); }
  };

  const deleteTopic = async (id: number) => {
    if (!confirm('Delete this topic and all its questions?')) return;
    setDeleting(id);
    try { await api.adminDeleteTopic(id); load(); } catch {}
    setDeleting(null);
  };

  const openResourceForm = (path: any) => {
    try { setResourceLinks(JSON.parse(path.resource_links || '[]')); } catch { setResourceLinks([]); }
    setShowResourceForm(path.id);
  };

  const saveResources = async (pathId: number) => {
    setSavingRes(true);
    try {
      await api.adminUpdatePathResources(pathId, resourceLinks);
      setMsg('Resources saved!'); setShowResourceForm(null); load();
    } catch (err: any) { setMsg(err.message); }
    setSavingRes(false);
  };

  const addLink = () => setResourceLinks(l => [...l, { label: '', url: '' }]);
  const removeLink = (i: number) => setResourceLinks(l => l.filter((_, idx) => idx !== i));
  const updateLink = (i: number, k: 'label' | 'url', v: string) =>
    setResourceLinks(l => l.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Learning Paths & Topics</h2>
        <button onClick={() => setShowPathForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4"/>Add Learning Path
        </button>
      </div>

      {msg && (
        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4"/>{msg}
        </div>
      )}

      {/* New path form */}
      {showPathForm && (
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
          <h3 className="font-semibold mb-4">New Learning Path</h3>
          <form onSubmit={createPath} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['path_key','Path Key','dsa-foundations'],['title','Title','DSA Foundations'],['tagline','Tagline','Master the basics'],['icon','Icon','book'],['color','Color','blue']].map(([k,l,p]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{l}</label>
                  <input value={(pathForm as any)[k]} placeholder={p} onChange={e => setPathForm(f => ({...f, [k]: e.target.value}))}
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Order</label>
                <input type="number" value={pathForm.order} onChange={e => setPathForm(f => ({...f, order: Number(e.target.value)}))}
                  className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
              <textarea value={pathForm.description} rows={2} placeholder="What will learners gain from this path?"
                onChange={e => setPathForm(f => ({...f, description: e.target.value}))}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold"><Save className="w-4 h-4"/>Create</button>
              <button type="button" onClick={() => setShowPathForm(false)} className="px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-sm"><X className="w-4 h-4"/></button>
            </div>
          </form>
        </div>
      )}

      {/* Paths list */}
      {loading ? <div className="p-8 text-center text-slate-400">Loading...</div> :
        paths.map(path => (
          <div key={path.id} className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
            {/* Path header */}
            <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy-750/30 transition"
              onClick={() => setExpanded(expanded === path.id ? null : path.id)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {path.order}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{path.title}</div>
                  <div className="text-xs text-slate-400">{path.tagline} · {path.topic_count} topics</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Resource links badge */}
                {(() => { try { const links = JSON.parse(path.resource_links || '[]'); return links.length > 0 ? (
                  <span className="text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 px-2 py-0.5 rounded-full">{links.length} resources</span>
                ) : null; } catch { return null; } })()}
                {expanded === path.id ? <ChevronUp className="w-4 h-4 text-slate-500"/> : <ChevronDown className="w-4 h-4 text-slate-500"/>}
              </div>
            </button>

            {expanded === path.id && (
              <div className="border-t border-navy-700 p-5 space-y-4">

                {/* Resource links manager */}
                <div className="bg-navy-900/50 rounded-xl border border-navy-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-cyan-400">🔗</span> Resource Links
                      <span className="text-xs text-slate-500 font-normal">— external study materials for this path</span>
                    </div>
                    {showResourceForm !== path.id && (
                      <button onClick={() => openResourceForm(path)}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition border border-cyan-600/30 px-2.5 py-1 rounded-lg">
                        <Pencil className="w-3 h-3"/>Edit Resources
                      </button>
                    )}
                  </div>

                  {showResourceForm === path.id ? (
                    <div className="space-y-3">
                      {resourceLinks.map((link, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)}
                            placeholder="Label (e.g. GeeksforGeeks Arrays)"
                            className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500" />
                          <input value={link.url} onChange={e => updateLink(i, 'url', e.target.value)}
                            placeholder="https://..."
                            className="flex-[2] bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500" />
                          <button onClick={() => removeLink(i)}
                            className="p-1.5 rounded-lg bg-navy-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition">
                            <X className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-3 pt-1">
                        <button onClick={addLink}
                          className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition">
                          <Plus className="w-3.5 h-3.5"/>Add Link
                        </button>
                        <button onClick={() => saveResources(path.id)} disabled={savingRes}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold disabled:opacity-50 transition">
                          <Save className="w-3.5 h-3.5"/>{savingRes ? 'Saving...' : 'Save Resources'}
                        </button>
                        <button onClick={() => setShowResourceForm(null)}
                          className="px-3 py-1.5 bg-navy-700 hover:bg-navy-600 rounded-lg text-xs transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      try {
                        const links = JSON.parse(path.resource_links || '[]');
                        return links.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {links.map((l: any, i: number) => (
                              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-navy-800 border border-navy-700 px-2.5 py-1 rounded-full transition">
                                🔗 {l.label}
                              </a>
                            ))}
                          </div>
                        ) : <p className="text-xs text-slate-500">No resources yet. Click "Edit Resources" to add study links.</p>;
                      } catch { return null; }
                    })()
                  )}
                </div>

                {/* Topics list */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Topics</div>
                  {path.topics.map((t: any) => (
                    <div key={t.id} className="bg-navy-900/50 rounded-lg border border-navy-700/50">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-5 shrink-0">{t.order}</span>
                          <div>
                            <div className="text-sm font-medium">{t.title}</div>
                            <div className="text-xs text-slate-500">{t.topic_key} · {t.verified_question_count} questions</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill text={t.difficulty} color={diffColor[t.difficulty] || 'bg-slate-700 text-slate-300'} />
                          <button onClick={() => deleteTopic(t.id)} disabled={deleting === t.id}
                            className="p-1.5 rounded-lg bg-navy-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition disabled:opacity-40">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                      {t.description && (
                        <div className="px-4 pb-2.5 pt-0">
                          <p className="text-xs text-slate-400 bg-navy-800/50 rounded-lg px-3 py-2 border border-navy-700/30">
                            {t.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add topic form */}
                {showTopicForm === path.path_key ? (
                  <form onSubmit={e => createTopic(e, path.path_key)} className="space-y-3 bg-navy-900/50 rounded-xl border border-navy-700 p-4">
                    <h4 className="font-semibold text-sm">Add Topic to "{path.title}"</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[['topic_key','Topic Key','arrays-basics'],['title','Title','Arrays Basics'],['category','Category','Core']].map(([k,l,p]) => (
                        <div key={k}>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">{l}</label>
                          <input value={(topicForm as any)[k]} placeholder={p} onChange={e => setTopicForm(f => ({...f, [k]: e.target.value}))}
                            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty</label>
                        <select value={topicForm.difficulty} onChange={e => setTopicForm(f => ({...f, difficulty: e.target.value}))}
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                          {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Order</label>
                        <input type="number" value={topicForm.order} onChange={e => setTopicForm(f => ({...f, order: Number(e.target.value)}))}
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Est. Minutes</label>
                        <input type="number" value={topicForm.estimated_minutes} onChange={e => setTopicForm(f => ({...f, estimated_minutes: Number(e.target.value)}))}
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                      </div>
                    </div>
                    {/* Description — full width */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Description / About this topic</label>
                      <textarea value={topicForm.description} rows={3}
                        placeholder="Briefly explain what this topic covers and why it matters for placements..."
                        onChange={e => setTopicForm(f => ({...f, description: e.target.value}))}
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold"><Save className="w-4 h-4"/>Add Topic</button>
                      <button type="button" onClick={() => setShowTopicForm(null)} className="px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-sm"><X className="w-4 h-4"/></button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => { setShowTopicForm(path.path_key); setTopicForm({ topic_key: '', title: '', category: 'Core', difficulty: 'Medium', order: path.topics.length + 1, estimated_minutes: 60, description: '' }); }}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition">
                    <Plus className="w-4 h-4"/>Add topic to this path
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
}

// ── Assignment Tab ─────────────────────────────────────────────────────────
const EMPTY_AQ = {
  topic_id: 0, type: 'mcq', title: '', description: '', difficulty: 'Easy',
  options: '["Option A","Option B","Option C","Option D"]', correct_answer: '',
  explanation: '', starter_code_python: '', starter_code_java: '', starter_code_js: '',
  reference_solution_python: '', test_cases: '[]', hints: '[]', order: 1
};

function AssignmentTab({ topics }: { topics: any[] }) {
  const [selectedTopic, setSelectedTopic] = useState<number>(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_AQ });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loadingQ, setLoadingQ] = useState(false);

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Load overview stats on mount
  useEffect(() => {
    api.adminGetAssignmentStats().then(setStats).catch(() => {});
  }, []);

  // Load questions when topic changes
  useEffect(() => {
    if (!selectedTopic) { setQuestions([]); return; }
    setLoadingQ(true);
    api.adminGetAssignment(selectedTopic).then(setQuestions).catch(() => {}).finally(() => setLoadingQ(false));
  }, [selectedTopic]);

  const mcqs = questions.filter(q => q.type === 'mcq');
  const coding = questions.filter(q => q.type === 'coding');
  const topicStat = stats.find(s => s.topic_id === selectedTopic);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.adminCreateAssignmentQ({ ...form, topic_id: selectedTopic });
      setMsg('Question added!'); setShowForm(false); setForm({ ...EMPTY_AQ, topic_id: selectedTopic });
      const updated = await api.adminGetAssignment(selectedTopic);
      setQuestions(updated);
      api.adminGetAssignmentStats().then(setStats).catch(() => {});
    } catch (err: any) { setError(err.message || 'Failed to save'); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm('Delete this assignment question?')) return;
    setDeleting(id);
    try {
      await api.adminDeleteAssignmentQ(id);
      setQuestions(qs => qs.filter(q => q.id !== id));
      api.adminGetAssignmentStats().then(setStats).catch(() => {});
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Topic Assignments</h2>
        <p className="text-slate-400 text-sm mt-1">Each topic needs 20 MCQs + 5 coding questions for the assignment.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.slice(0, 9).map(s => (
          <button key={s.topic_id} onClick={() => { setSelectedTopic(s.topic_id); setShowForm(false); }}
            className={`text-left px-4 py-3 rounded-xl border transition ${
              selectedTopic === s.topic_id
                ? 'bg-brand-600/20 border-brand-500/60'
                : 'bg-navy-800 border-navy-700 hover:border-brand-500/40'
            }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">{s.topic}</span>
              {s.complete
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0"/>
                : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0"/>}
            </div>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className={s.mcq >= 20 ? 'text-green-400' : 'text-amber-400'}>MCQ {s.mcq}/20</span>
              <span className={s.coding >= 5 ? 'text-green-400' : 'text-amber-400'}>Code {s.coding}/5</span>
              {s.submissions > 0 && <span className="text-slate-500">{s.submissions} submissions</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Topic selector (full dropdown for all topics) */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <select value={selectedTopic} onChange={e => { setSelectedTopic(Number(e.target.value)); setShowForm(false); }}
            className="w-full appearance-none bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
            <option value={0}>Select a topic…</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none"/>
        </div>
        {selectedTopic > 0 && (
          <button onClick={() => { setShowForm(true); setForm({ ...EMPTY_AQ, topic_id: selectedTopic }); setError(''); }}
            disabled={showForm}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold transition disabled:opacity-40">
            <Plus className="w-4 h-4"/>Add Question
          </button>
        )}
      </div>

      {msg && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"><CheckCircle2 className="w-4 h-4"/>{msg}</div>}

      {selectedTopic > 0 && (
        <>
          {/* Progress bar */}
          {topicStat && (
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{topicStat.topic} — Assignment Progress</span>
                {topicStat.complete
                  ? <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full">✓ Complete</span>
                  : <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">Incomplete</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">MCQ Questions</span>
                    <span className={topicStat.mcq >= 20 ? 'text-green-400' : 'text-amber-400'}>{topicStat.mcq} / 20</span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(topicStat.mcq / 20 * 100, 100)}%` }}/>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Coding Questions</span>
                    <span className={topicStat.coding >= 5 ? 'text-green-400' : 'text-amber-400'}>{topicStat.coding} / 5</span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(topicStat.coding / 5 * 100, 100)}%` }}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add question form */}
          {showForm && (
            <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Add Assignment Question</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={save} className="space-y-4">
                {/* Type + Difficulty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Question Type</label>
                    <div className="flex gap-2">
                      {['mcq','coding'].map(t => (
                        <button key={t} type="button" onClick={() => setF('type', t)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                            form.type === t ? 'bg-brand-600 border-brand-500 text-white' : 'bg-navy-900 border-navy-700 text-slate-400 hover:text-white'
                          }`}>
                          {t === 'mcq' ? '📝 MCQ' : '💻 Coding'}
                          {form.type === t && (
                            <span className="ml-1 text-xs opacity-70">
                              ({form.type === 'mcq' ? `${mcqs.length}/20` : `${coding.length}/5`})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty</label>
                    <div className="relative">
                      <select value={form.difficulty} onChange={e => setF('difficulty', e.target.value)}
                        className="w-full appearance-none bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
                        {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none"/>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setF('title', e.target.value)} required
                    placeholder="Question title..."
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description / Problem Statement *</label>
                  <textarea value={form.description} onChange={e => setF('description', e.target.value)} required rows={4}
                    placeholder="Full question text..."
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y"/>
                </div>

                {/* MCQ-specific */}
                {form.type === 'mcq' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Options (JSON array)</label>
                      <textarea value={form.options} onChange={e => setF('options', e.target.value)} rows={2}
                        placeholder='["Option A","Option B","Option C","Option D"]'
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Correct Answer</label>
                        <input value={form.correct_answer} onChange={e => setF('correct_answer', e.target.value)}
                          placeholder="Option A"
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Order (1-20)</label>
                        <input type="number" min={1} max={20} value={form.order} onChange={e => setF('order', Number(e.target.value))}
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Explanation</label>
                      <textarea value={form.explanation} onChange={e => setF('explanation', e.target.value)} rows={2}
                        placeholder="Explain the correct answer..."
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none"/>
                    </div>
                  </>
                )}

                {/* Coding-specific */}
                {form.type === 'coding' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Test Cases (JSON)</label>
                      <textarea value={form.test_cases} onChange={e => setF('test_cases', e.target.value)} rows={3}
                        placeholder={'[{"input":"5\\n1 2 3 4 5","expected_output":"5"}]'}
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y font-mono"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Starter Code (Python)</label>
                        <textarea value={form.starter_code_python} onChange={e => setF('starter_code_python', e.target.value)} rows={3}
                          placeholder="def solution():\n    pass"
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y font-mono"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Reference Solution (Python)</label>
                        <textarea value={form.reference_solution_python} onChange={e => setF('reference_solution_python', e.target.value)} rows={3}
                          placeholder="def solution():\n    ..."
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-y font-mono"/>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Starter Code (Java)</label>
                        <textarea value={form.starter_code_java} onChange={e => setF('starter_code_java', e.target.value)} rows={2}
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Starter Code (JS)</label>
                        <textarea value={form.starter_code_js} onChange={e => setF('starter_code_js', e.target.value)} rows={2}
                          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Hints (JSON array)</label>
                      <textarea value={form.hints} onChange={e => setF('hints', e.target.value)} rows={2}
                        placeholder='["Think about edge cases","Use a two-pointer approach"]'
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Order (1-5)</label>
                      <input type="number" min={1} max={5} value={form.order} onChange={e => setF('order', Number(e.target.value))}
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"/>
                    </div>
                  </>
                )}

                {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    <Save className="w-4 h-4"/>{saving ? 'Adding...' : 'Add Question'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 bg-navy-700 hover:bg-navy-600 rounded-xl text-sm transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Questions list */}
          {loadingQ ? <div className="p-8 text-center text-slate-400">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MCQ column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">📝 MCQ Questions</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${mcqs.length >= 20 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {mcqs.length}/20
                  </span>
                </div>
                {mcqs.length === 0 && <p className="text-slate-500 text-sm">No MCQ questions yet.</p>}
                {mcqs.map(q => (
                  <div key={q.id} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">#{q.order}</span>
                          <Pill text={q.difficulty} color={diffColor[q.difficulty] || 'bg-slate-700 text-slate-300'}/>
                        </div>
                        <p className="text-sm font-medium">{q.title}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{q.description}</p>
                        {q.correct_answer && <p className="text-xs text-green-400 mt-1">✓ {q.correct_answer}</p>}
                      </div>
                      <button onClick={() => del(q.id)} disabled={deleting === q.id}
                        className="p-1.5 rounded-lg bg-navy-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition shrink-0 disabled:opacity-40">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coding column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">💻 Coding Questions</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${coding.length >= 5 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {coding.length}/5
                  </span>
                </div>
                {coding.length === 0 && <p className="text-slate-500 text-sm">No coding questions yet.</p>}
                {coding.map(q => (
                  <div key={q.id} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">#{q.order}</span>
                          <Pill text={q.difficulty} color={diffColor[q.difficulty] || 'bg-slate-700 text-slate-300'}/>
                        </div>
                        <p className="text-sm font-medium">{q.title}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{q.description}</p>
                        {q.starter_code_python && (
                          <p className="text-xs text-cyan-400 mt-1 font-mono truncate">
                            {q.starter_code_python.split('\n')[0]}...
                          </p>
                        )}
                      </div>
                      <button onClick={() => del(q.id)} disabled={deleting === q.id}
                        className="p-1.5 rounded-lg bg-navy-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition shrink-0 disabled:opacity-40">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────────────────────
function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (next !== confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      const res = await api.adminChangePassword(cur, next);
      // Backend returns a fresh token — update it so this session stays alive
      localStorage.setItem('learnlens_token', res.new_token);
      localStorage.setItem('learnlens_admin_token', res.new_token);
      setSuccess('Password changed! All other devices have been logged out.');
      setCur(''); setNext(''); setConfirm('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold">Admin Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your admin account security.</p>
      </div>

      {/* Change password card */}
      <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-600/20 border border-brand-600/30">
            <KeyRound className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="font-semibold">Change Password</div>
            <div className="text-xs text-slate-400">Changing the password will instantly log out all other devices.</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} value={cur}
                onChange={e => setCur(e.target.value)} required
                placeholder="Enter current password"
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-brand-500 transition" />
              <button type="button" onClick={() => setShowCur(v => !v)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNext ? 'text' : 'password'} value={next}
                onChange={e => setNext(e.target.value)} required
                placeholder="Min. 8 characters"
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-brand-500 transition" />
              <button type="button" onClick={() => setShowNext(v => !v)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            {next && (
              <div className="mt-1.5 flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    next.length >= i * 3
                      ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-amber-500' : 'bg-green-500'
                      : 'bg-navy-700'
                  }`} />
                ))}
                <span className="text-xs text-slate-500 ml-1">
                  {next.length < 6 ? 'Weak' : next.length < 9 ? 'Fair' : next.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirm New Password</label>
            <input type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required
              placeholder="Re-enter new password"
              className={`w-full bg-navy-900 border rounded-lg px-3 py-2 text-sm focus:outline-none transition ${
                confirm && confirm !== next
                  ? 'border-red-500/60 focus:border-red-500'
                  : confirm && confirm === next
                  ? 'border-green-500/60 focus:border-green-500'
                  : 'border-navy-700 focus:border-brand-500'
              }`} />
            {confirm && confirm !== next && (
              <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
            </div>
          )}

          <button type="submit" disabled={saving || (!!confirm && confirm !== next)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-sm transition disabled:opacity-50">
            <KeyRound className="w-4 h-4" />
            {saving ? 'Updating...' : 'Change Password & Logout All Devices'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-navy-800 border border-red-500/20 rounded-2xl p-6 space-y-3">
        <div className="font-semibold text-red-400">Danger Zone</div>
        <p className="text-slate-400 text-sm">Log out from this admin session immediately.</p>
        <button onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-semibold transition">
          <LogOut className="w-4 h-4" />Logout Admin Session
        </button>
      </div>
    </div>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────────────────
export const AdminPanel = () => {
  const [authed] = useState(true); // Auth is handled by the shared login modal
  const [tab, setTab] = useState<AdminTab>('overview');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filterTopic, setFilterTopic] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);

  const loadTopics = () => api.adminGetTopics().then(setTopics).catch(() => {});
  const loadQuestions = () => { setLoadingQ(true); api.adminGetQuestions(filterTopic || undefined).then(setQuestions).catch(() => {}).finally(() => setLoadingQ(false)); };
  const loadUsers = () => api.adminGetUsers().then(setUsers).catch(() => {});

  useEffect(() => { loadTopics(); loadQuestions(); loadUsers(); }, []);
  useEffect(() => { loadQuestions(); }, [filterTopic]);

  const logout = () => {
    localStorage.removeItem('learnlens_admin_token');
    localStorage.removeItem('learnlens_token');
    setAuthed(false);
    window.location.reload();
  };

  const deleteQ = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    setDeleting(id);
    try { await api.adminDeleteQuestion(id); await loadQuestions(); } catch {}
    setDeleting(null);
  };

  const filtered = questions.filter(q =>
    !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.question_uid.toLowerCase().includes(search.toLowerCase())
  );

  const TABS: { key: AdminTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'questions', label: 'Questions', icon: BookOpen },
    { key: 'paths', label: 'Learning Paths', icon: Layers },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: KeyRound },
  ];

  if (!authed) return null; // Should never reach here — auth is via shared modal

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* Top bar */}
      <header className="bg-navy-900 border-b border-navy-700 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-400" />
          <span className="font-bold text-lg">LearnLens Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-navy-800 rounded-lg p-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Overview */}
        {tab === 'overview' && <OverviewTab />}

        {/* Paths */}
        {tab === 'paths' && <PathsTab />}

        {/* Assignments */}
        {tab === 'assignments' && <AssignmentTab topics={topics} />}

        {/* Settings */}
        {tab === 'settings' && <SettingsTab onLogout={logout} />}

        {/* Questions */}
        {tab === 'questions' && (
          <>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="relative">
                  <select value={filterTopic} onChange={e => setFilterTopic(Number(e.target.value))}
                    className="appearance-none bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8 min-w-[160px]">
                    <option value={0}>All Topics</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                    className="bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-500 w-48" />
                </div>
                <span className="text-slate-400 text-sm">{filtered.length} questions</span>
              </div>
              <button onClick={() => { setEditQ(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold transition">
                <Plus className="w-4 h-4" />Add Question
              </button>
            </div>

            {showForm && (
              <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4">{editQ ? 'Edit Question' : 'New Question'}</h2>
                <QuestionForm topics={topics} initial={editQ ?? EMPTY_Q}
                  onSave={() => { setShowForm(false); setEditQ(null); loadQuestions(); }}
                  onCancel={() => { setShowForm(false); setEditQ(null); }} />
              </div>
            )}

            <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
              {loadingQ ? <div className="p-8 text-center text-slate-400">Loading...</div> :
                filtered.length === 0 ? <div className="p-8 text-center text-slate-400">No questions yet. Click "Add Question".</div> : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-700 text-slate-400 text-xs uppercase">
                        <th className="text-left px-4 py-3">Title</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Topic</th>
                        <th className="text-left px-4 py-3">Difficulty</th>
                        <th className="text-left px-4 py-3 hidden sm:table-cell">Type</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(q => {
                        const topic = topics.find(t => t.id === q.topic_id);
                        return (
                          <tr key={q.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition">
                            <td className="px-4 py-3">
                              <div className="font-medium">{q.title}</div>
                              <div className="text-slate-500 text-xs">{q.question_uid}</div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-slate-400">{topic?.title || '—'}</td>
                            <td className="px-4 py-3"><Pill text={q.difficulty} color={diffColor[q.difficulty] || 'bg-slate-700 text-slate-300'} /></td>
                            <td className="px-4 py-3 hidden sm:table-cell"><Pill text={q.type.toUpperCase()} color="bg-navy-700 text-slate-300" /></td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditQ(q); setShowForm(true); }}
                                  className="p-1.5 rounded-lg bg-navy-700 hover:bg-brand-600/30 text-slate-400 hover:text-brand-400 transition">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteQ(q.id)} disabled={deleting === q.id}
                                  className="p-1.5 rounded-lg bg-navy-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition disabled:opacity-40">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
            </div>
          </>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Registered Users</h2>
              <span className="text-slate-400 text-sm">{users.length} total</span>
            </div>
            <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
              {users.length === 0 ? <div className="p-8 text-center text-slate-400">No users registered yet.</div> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-700 text-slate-400 text-xs uppercase">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Email</th>
                      <th className="text-left px-5 py-3">Points</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Streak</th>
                      <th className="text-left px-5 py-3 hidden lg:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition">
                        <td className="px-5 py-3 font-medium">{u.name}</td>
                        <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{u.email}</td>
                        <td className="px-5 py-3"><span className="text-brand-400 font-semibold">{u.points}</span></td>
                        <td className="px-5 py-3 hidden sm:table-cell"><span className="text-amber-400">🔥 {u.streak}d</span></td>
                        <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
