import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Mic, ChevronDown, Play, Send, CheckCircle2,
  AlertCircle, RotateCcw, Trophy, Clock, Star
} from 'lucide-react';

interface Question { text: string; answer: string; feedback: string; score: number | null; }

const ROLES = ['SDE-1', 'SDE-2', 'Intern', 'Product Manager', 'Data Analyst'];
const ROUND_TYPES = ['dsa', 'hr', 'system-design', 'behavioural'];

export const MockInterview = () => {
  const [role, setRole] = useState('SDE-1');
  const [roundType, setRoundType] = useState('dsa');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const d = await api.getMockInterview(role, roundType);
      setQuestions(d.questions.map((q: string) => ({
        text: q, answer: '', feedback: '', score: null
      })));
      setCurrent(0);
      setStarted(true);
      setDone(false);
    } catch {}
    setLoading(false);
  };

  const reset = () => {
    setStarted(false); setDone(false);
    setQuestions([]); setCurrent(0);
  };

  const setAnswer = (val: string) => {
    setQuestions(qs => qs.map((q, i) => i === current ? { ...q, answer: val } : q));
  };

  // Submit current answer → get AI feedback via communication coach
  const submitAnswer = async () => {
    const q = questions[current];
    if (!q.answer.trim()) return;
    setSubmitting(true);

    // Build history of previous Q&A pairs
    const history: { role: string; content: string }[] = [];
    for (let i = 0; i < current; i++) {
      history.push({ role: 'assistant', content: questions[i].text });
      history.push({ role: 'user', content: questions[i].answer });
    }

    try {
      const res = await api.askCommunicationCoach({
        mode: 'interview',
        topic: `${role} ${roundType} round`,
        user_message: `Question: "${q.text}"\n\nMy Answer: "${q.answer}"\n\nPlease give: 1) Brief feedback on my answer (2-3 sentences), 2) A score out of 10, 3) One tip to improve. Format: FEEDBACK: ... | SCORE: X/10 | TIP: ...`,
        history,
        role,
        preferred_language: 'english'
      });

      // Parse score from reply
      const reply: string = res.reply || '';
      const scoreMatch = reply.match(/SCORE:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      setQuestions(qs => qs.map((qq, i) =>
        i === current ? { ...qq, feedback: reply, score } : qq
      ));
    } catch {
      setQuestions(qs => qs.map((qq, i) =>
        i === current ? { ...qq, feedback: 'Could not get feedback. Check your API key.', score: null } : qq
      ));
    }
    setSubmitting(false);
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent(c => c + 1);
    else setDone(true);
  };

  const avgScore = () => {
    const scored = questions.filter(q => q.score !== null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, q) => s + (q.score || 0), 0) / scored.length);
  };

  const q = questions[current];

  // ── Setup screen ───────────────────────────────────────────────────────
  if (!started) return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-brand-600/20 border border-brand-600/30">
          <Mic className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mock Interview</h1>
          <p className="text-slate-400 text-sm">Answer each question and get instant AI feedback</p>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Target Role</label>
            <div className="relative">
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full appearance-none bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Round Type</label>
            <div className="relative">
              <select value={roundType} onChange={e => setRoundType(e.target.value)}
                className="w-full appearance-none bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 pr-8">
                {ROUND_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <button onClick={start} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:opacity-90 rounded-xl font-bold text-sm transition disabled:opacity-50">
          <Play className="w-4 h-4" />{loading ? 'Loading...' : 'Start Interview'}
        </button>
      </div>

      {/* Tips */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
        <div className="font-semibold text-sm mb-3">💡 Interview Tips</div>
        <ul className="space-y-2 text-slate-400 text-sm">
          {['Think aloud — explain your thought process before answering',
            'Use STAR format for behavioural questions (Situation, Task, Action, Result)',
            'Ask clarifying questions before solving',
            'Mention time & space complexity for DSA answers',
            'It\'s okay to take 30 seconds to think before answering'].map(tip => (
            <li key={tip} className="flex gap-2"><span className="text-brand-400 mt-0.5">›</span>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  // ── Results screen ─────────────────────────────────────────────────────
  if (done) {
    const avg = avgScore();
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 text-center space-y-3">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold">Interview Complete!</h2>
          {avg !== null && (
            <div className="flex items-center justify-center gap-2">
              <div className="text-4xl font-extrabold text-brand-400">{avg}</div>
              <div className="text-slate-400 text-lg">/10</div>
            </div>
          )}
          <p className="text-slate-400 text-sm">
            {avg === null ? 'No AI feedback (API key needed for scoring)' :
             avg >= 8 ? '🎉 Excellent performance! You\'re interview-ready.' :
             avg >= 6 ? '👍 Good effort. A bit more practice and you\'ll nail it.' :
             '📚 Keep practicing. Review the feedback below and try again.'}
          </p>
        </div>

        {/* Per-question review */}
        <div className="space-y-4">
          <h3 className="font-bold">Question Review</h3>
          {questions.map((q, i) => (
            <div key={i} className="bg-navy-800 border border-navy-700 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-slate-300">Q{i + 1}. {q.text}</div>
                {q.score !== null && (
                  <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                    q.score >= 8 ? 'bg-green-500/20 text-green-400' :
                    q.score >= 6 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{q.score}/10</div>
                )}
              </div>
              <div className="bg-navy-900 rounded-lg px-3 py-2 text-sm text-slate-300 italic">
                "{q.answer || 'No answer given'}"
              </div>
              {q.feedback && (
                <div className="text-xs text-slate-400 bg-navy-900/50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {q.feedback}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-sm transition">
          <RotateCcw className="w-4 h-4" />Start New Interview
        </button>
      </div>
    );
  }

  // ── Active interview screen ────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Question {current + 1} of {questions.length}</span>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{role} · {roundType}</span>
            <button onClick={reset} className="hover:text-red-400 transition text-xs flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5"/>Restart
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-600 to-cyan-500 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        {/* Question dots */}
        <div className="flex gap-1.5">
          {questions.map((qq, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-all ${
              i < current ? (qq.score !== null ? (qq.score >= 7 ? 'bg-green-500' : 'bg-amber-500') : 'bg-brand-600') :
              i === current ? 'bg-brand-400 animate-pulse' : 'bg-navy-700'
            }`} />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
            {current + 1}
          </div>
          <p className="text-base font-semibold leading-relaxed text-slate-100">{q.text}</p>
        </div>

        {/* Answer area */}
        {q.score === null && !q.feedback ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-400">Your Answer</label>
            <textarea
              value={q.answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer(); }}
              placeholder="Type your answer here... (Ctrl+Enter to submit)"
              rows={6}
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 resize-y transition"
            />
            <div className="flex gap-3">
              <button onClick={submitAnswer} disabled={submitting || !q.answer.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-sm transition disabled:opacity-50">
                <Send className="w-4 h-4" />{submitting ? 'Getting feedback...' : 'Submit Answer'}
              </button>
              <button onClick={next}
                className="px-4 py-2.5 bg-navy-700 hover:bg-navy-600 rounded-xl text-sm text-slate-400 hover:text-white transition">
                Skip →
              </button>
            </div>
          </div>
        ) : (
          /* Feedback view */
          <div className="space-y-4">
            {/* User's answer */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5">Your Answer</div>
              <div className="bg-navy-900 rounded-xl px-4 py-3 text-sm text-slate-300 italic">
                "{q.answer || 'Skipped'}"
              </div>
            </div>

            {/* AI Feedback */}
            {q.feedback && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400">AI Feedback</span>
                  {q.score !== null && (
                    <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      q.score >= 8 ? 'bg-green-500/20 text-green-400' :
                      q.score >= 6 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>Score: {q.score}/10</span>
                  )}
                </div>
                <div className="bg-navy-900/70 border border-navy-600 rounded-xl px-4 py-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {q.feedback}
                </div>
              </div>
            )}

            <button onClick={next}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-sm transition">
              {current < questions.length - 1 ? 'Next Question →' : '🏁 Finish & See Results'}
            </button>
          </div>
        )}
      </div>

      {/* Skipped/answered counter */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400"/>
          {questions.filter(q => q.score !== null).length} answered
        </span>
        <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-slate-500"/>
          {questions.filter(q => q.score === null && !q.feedback && !q.answer).length} remaining
        </span>
      </div>
    </div>
  );
};
