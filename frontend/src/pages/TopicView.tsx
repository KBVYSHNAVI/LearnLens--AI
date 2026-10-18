import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Topic } from '../types';
import {
  ArrowLeft, Sparkles, Code2, ClipboardList, CheckCircle2,
  XCircle, Trophy, ChevronDown, Send, RotateCcw, Lock,
  AlertCircle, Play, Clock
} from 'lucide-react';

// ── MCQ question component ─────────────────────────────────────────────────
function MCQCard({
  q, index, selected, submitted, correct_answer, onSelect
}: {
  q: any; index: number; selected: string; submitted: boolean;
  correct_answer?: string; onSelect: (v: string) => void;
}) {
  let options: string[] = [];
  try { options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch { options = []; }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xs text-slate-500 shrink-0 mt-0.5">Q{index + 1}.</span>
        <p className="text-sm font-medium leading-relaxed">{q.title}</p>
        {q.difficulty && (
          <span className={`ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full ${
            q.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
            q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
          }`}>{q.difficulty}</span>
        )}
      </div>
      {q.description && q.description !== q.title && (
        <p className="text-xs text-slate-400 pl-5">{q.description}</p>
      )}
      <div className="space-y-2 pl-5">
        {options.map((opt: string, oi: number) => {
          const isSelected = selected === opt;
          const isCorrect = submitted && opt === correct_answer;
          const isWrong = submitted && isSelected && opt !== correct_answer;
          return (
            <button key={oi} onClick={() => !submitted && onSelect(opt)}
              disabled={submitted}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${
                isCorrect ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                isWrong ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                isSelected ? 'bg-brand-600/25 border-brand-500/60 text-white' :
                'bg-navy-900 border-navy-700 text-slate-300 hover:border-brand-500/40 hover:text-white'
              }`}>
              <span className="font-mono text-xs mr-2 text-slate-500">{String.fromCharCode(65 + oi)}.</span>
              {opt}
              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2 text-green-400"/>}
              {isWrong && <XCircle className="w-3.5 h-3.5 inline ml-2 text-red-400"/>}
            </button>
          );
        })}
      </div>
      {submitted && q.explanation && (
        <div className="pl-5">
          <p className="text-xs text-slate-400 bg-navy-900/60 rounded-lg px-3 py-2 border border-navy-700/50">
            💡 {q.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Coding question component ──────────────────────────────────────────────
function CodingCard({
  q, index, lang, code, result, onCodeChange, onRun, running
}: {
  q: any; index: number; lang: string; code: string; result: any;
  onCodeChange: (v: string) => void; onRun: () => void; running: boolean;
}) {
  const [showHints, setShowHints] = useState(false);
  let hints: string[] = [];
  try { hints = typeof q.hints === 'string' ? JSON.parse(q.hints) : (q.hints || []); } catch {}

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500">Problem {index + 1}</span>
            {q.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                q.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
              }`}>{q.difficulty}</span>
            )}
          </div>
          <h4 className="font-semibold">{q.title}</h4>
        </div>
        {result && (
          <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
            result.status === 'passed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {result.status === 'passed' ? '✓ Passed' : '✗ Failed'}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{q.description}</p>

      {hints.length > 0 && (
        <button onClick={() => setShowHints(v => !v)}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHints ? 'rotate-180' : ''}`}/>
          {showHints ? 'Hide hints' : `Show hints (${hints.length})`}
        </button>
      )}
      {showHints && hints.length > 0 && (
        <div className="space-y-1.5">
          {hints.map((h, i) => (
            <p key={i} className="text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              💡 {h}
            </p>
          ))}
        </div>
      )}

      {/* Code editor */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400">Your Solution ({lang})</label>
        <textarea value={code} onChange={e => onCodeChange(e.target.value)} rows={10}
          spellCheck={false}
          className="w-full bg-navy-950 border border-navy-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-500 resize-y text-green-300"
          placeholder="Write your solution here..."/>
      </div>

      {result?.output && (
        <div className={`text-xs font-mono rounded-lg px-3 py-2 border ${
          result.status === 'passed'
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="font-semibold mb-1">{result.status === 'passed' ? 'All test cases passed!' : 'Test failed'}</div>
          <pre className="whitespace-pre-wrap">{result.output}</pre>
        </div>
      )}

      <button onClick={onRun} disabled={running || !code.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold transition disabled:opacity-50">
        <Play className="w-4 h-4"/>{running ? 'Running...' : 'Run & Test'}
      </button>
    </div>
  );
}

// ── Assignment section ─────────────────────────────────────────────────────
function AssignmentSection({ topicId, topicTitle }: { topicId: number; topicTitle: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'mcq' | 'coding' | 'result'>('intro');
  const [lang, setLang] = useState('python');

  // MCQ state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState<any>(null);

  // Coding state
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [runResults, setRunResults] = useState<Record<string, any>>({});
  const [running, setRunning] = useState<string | null>(null);

  // Final result
  const [finalResult, setFinalResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getAssignment(topicId)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [topicId]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading assignment...</div>;
  if (!data) return null;

  const { mcq_questions = [], coding_questions = [], previous_submission } = data;
  const hasAssignment = mcq_questions.length > 0 || coding_questions.length > 0;

  if (!hasAssignment) return (
    <div className="bg-navy-800 border border-navy-700 border-dashed rounded-xl p-8 text-center">
      <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2"/>
      <p className="text-slate-400 text-sm">Assignment not available yet — admin hasn't added questions.</p>
    </div>
  );

  // ── Intro screen ──
  if (phase === 'intro') return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-brand-600/20 border border-brand-600/30">
          <ClipboardList className="w-6 h-6 text-brand-400"/>
        </div>
        <div>
          <h3 className="text-lg font-bold">Topic Assignment</h3>
          <p className="text-slate-400 text-sm">Test your understanding of {topicTitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'MCQ Questions', value: mcq_questions.length, max: 20, color: 'text-brand-400' },
          { label: 'Coding Problems', value: coding_questions.length, max: 5, color: 'text-cyan-400' },
          { label: 'Pass Score', value: '60%', max: null, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-navy-900/60 rounded-xl p-3 text-center border border-navy-700/50">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Previous result */}
      {previous_submission && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          previous_submission.status === 'passed'
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {previous_submission.status === 'passed'
            ? <CheckCircle2 className="w-5 h-5 shrink-0"/>
            : <AlertCircle className="w-5 h-5 shrink-0"/>}
          <div className="text-sm">
            <span className="font-semibold">Previous attempt: {previous_submission.overall_score}%</span>
            <span className="text-xs ml-2 opacity-70">({previous_submission.status})</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-navy-900/40 rounded-xl p-4 space-y-2 border border-navy-700/30">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Instructions</p>
        <ul className="space-y-1 text-sm text-slate-300">
          <li className="flex gap-2"><span className="text-brand-400">1.</span>Complete all MCQ questions first</li>
          <li className="flex gap-2"><span className="text-brand-400">2.</span>Then attempt the coding problems</li>
          <li className="flex gap-2"><span className="text-brand-400">3.</span>MCQ carries 60% weight, coding 40%</li>
          <li className="flex gap-2"><span className="text-brand-400">4.</span>You need 60% overall to pass</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <select value={lang} onChange={e => setLang(e.target.value)}
          className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
        </select>
        <button onClick={() => setPhase('mcq')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:opacity-90 rounded-xl font-bold text-sm transition">
          <Play className="w-4 h-4"/>
          {previous_submission ? 'Retake Assignment' : 'Start Assignment'}
        </button>
      </div>
    </div>
  );

  // ── MCQ phase ──
  if (phase === 'mcq') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('intro')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <h3 className="font-bold text-lg">📝 MCQ Section</h3>
          <span className="text-xs bg-brand-600/20 text-brand-400 border border-brand-600/30 px-2.5 py-0.5 rounded-full">
            {Object.keys(mcqAnswers).length}/{mcq_questions.length} answered
          </span>
        </div>
        {!mcqSubmitted && (
          <button
            onClick={() => {
              // Score locally for display then move to coding
              let correct = 0;
              mcq_questions.forEach((q: any) => {
                if ((mcqAnswers[q.id] || '').trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()) correct++;
              });
              const pct = mcq_questions.length ? (correct / mcq_questions.length * 100) : 0;
              setMcqResult({ correct, total: mcq_questions.length, pct: Math.round(pct) });
              setMcqSubmitted(true);
            }}
            disabled={Object.keys(mcqAnswers).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold disabled:opacity-40 transition">
            <Send className="w-3.5 h-3.5"/>Submit MCQs
          </button>
        )}
      </div>

      <div className="space-y-3">
        {mcq_questions.map((q: any, i: number) => (
          <MCQCard key={q.id} q={q} index={i}
            selected={mcqAnswers[q.id] || ''}
            submitted={mcqSubmitted}
            correct_answer={q.correct_answer}
            onSelect={v => setMcqAnswers(a => ({ ...a, [q.id]: v }))}/>
        ))}
      </div>

      {mcqSubmitted && mcqResult && (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-extrabold ${mcqResult.pct >= 60 ? 'text-green-400' : 'text-amber-400'}`}>
                {mcqResult.pct}%
              </div>
              <div className="text-xs text-slate-400">{mcqResult.correct}/{mcqResult.total} correct</div>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${mcqResult.pct >= 60 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${mcqResult.pct}%` }}/>
              </div>
              <p className="text-sm text-slate-300 mt-2">
                {coding_questions.length > 0
                  ? 'Great! Now move on to the coding section.'
                  : mcqResult.pct >= 60 ? '🎉 You passed!' : 'Keep practicing and try again.'}
              </p>
            </div>
          </div>
          {coding_questions.length > 0 ? (
            <button onClick={() => setPhase('coding')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-sm transition">
              <Code2 className="w-4 h-4"/>Continue to Coding Section →
            </button>
          ) : (
            <button onClick={async () => {
              setSubmitting(true);
              try {
                const res = await api.submitAssignment({
                  topic_id: topicId, mcq_answers: Object.fromEntries(
                    Object.entries(mcqAnswers).map(([k, v]) => [k, v])
                  ), coding_results: {}
                });
                setFinalResult(res); setPhase('result');
              } catch {}
              setSubmitting(false);
            }} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold text-sm transition disabled:opacity-50">
              <Trophy className="w-4 h-4"/>{submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ── Coding phase ──
  if (phase === 'coding') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('mcq')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <h3 className="font-bold text-lg">💻 Coding Section</h3>
          <span className="text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 px-2.5 py-0.5 rounded-full">
            {Object.values(runResults).filter((r: any) => r?.status === 'passed').length}/{coding_questions.length} passed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-500">
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
      </div>

      {coding_questions.map((q: any, i: number) => {
        const starterMap: Record<string, string> = {
          python: q.starter_code_python || '',
          java: q.starter_code_java || '',
          javascript: q.starter_code_js || ''
        };
        const codeKey = `${q.id}_${lang}`;
        const currentCode = codes[codeKey] ?? starterMap[lang];

        return (
          <CodingCard key={q.id} q={q} index={i} lang={lang}
            code={currentCode}
            result={runResults[q.id]}
            onCodeChange={v => setCodes(c => ({ ...c, [codeKey]: v }))}
            running={running === String(q.id)}
            onRun={async () => {
              setRunning(String(q.id));
              try {
                // Use a temp coding question ID via the regular run endpoint
                // Since assignment questions are separate, we run code directly
                const r = await api.runCode(0, lang, currentCode, '') as any;
                const passed = r.status === 'Passed' || (r.passed_count && r.passed_count === r.total_count);
                setRunResults(prev => ({
                  ...prev,
                  [q.id]: { status: passed ? 'passed' : 'failed', output: r.output || r.feedback || '' }
                }));
              } catch (e: any) {
                setRunResults(prev => ({ ...prev, [q.id]: { status: 'failed', output: e.message || 'Error' } }));
              }
              setRunning(null);
            }}
          />
        );
      })}

      <button onClick={async () => {
        setSubmitting(true);
        const codingResultsMap: Record<string, string> = {};
        coding_questions.forEach((q: any) => {
          codingResultsMap[q.id] = runResults[q.id]?.status || 'failed';
        });
        try {
          const res = await api.submitAssignment({
            topic_id: topicId,
            mcq_answers: Object.fromEntries(Object.entries(mcqAnswers).map(([k, v]) => [k, v])),
            coding_results: codingResultsMap
          });
          setFinalResult(res); setPhase('result');
        } catch {}
        setSubmitting(false);
      }} disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-600 to-cyan-500 hover:opacity-90 rounded-xl font-bold text-sm transition disabled:opacity-50">
        <Trophy className="w-4 h-4"/>{submitting ? 'Submitting...' : 'Submit Assignment'}
      </button>
    </div>
  );

  // ── Result phase ──
  if (phase === 'result' && finalResult) return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-8 text-center space-y-5">
      <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
        finalResult.passed ? 'bg-green-500/20 border-2 border-green-500/50' : 'bg-red-500/20 border-2 border-red-500/50'
      }`}>
        {finalResult.passed
          ? <Trophy className="w-8 h-8 text-green-400"/>
          : <RotateCcw className="w-8 h-8 text-red-400"/>}
      </div>
      <div>
        <div className={`text-4xl font-extrabold ${finalResult.passed ? 'text-green-400' : 'text-red-400'}`}>
          {finalResult.overall_score}%
        </div>
        <div className="text-lg font-bold mt-1">
          {finalResult.passed ? '🎉 Assignment Passed!' : '📚 Keep Practising'}
        </div>
        <p className="text-slate-400 text-sm mt-2">
          {finalResult.passed
            ? 'Excellent work! You\'ve demonstrated strong understanding of this topic.'
            : 'Review the topic material and try again. You need 60% to pass.'}
        </p>
      </div>
      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="bg-navy-900/60 rounded-xl p-3 border border-navy-700/50">
          <div className="text-xl font-bold text-brand-400">{finalResult.mcq_score}%</div>
          <div className="text-xs text-slate-400 mt-0.5">MCQ Score</div>
          <div className="text-xs text-slate-500">{finalResult.mcq_correct}/{finalResult.mcq_total} correct</div>
        </div>
        {finalResult.coding_total > 0 && (
          <div className="bg-navy-900/60 rounded-xl p-3 border border-navy-700/50">
            <div className="text-xl font-bold text-cyan-400">
              {finalResult.coding_total ? Math.round(finalResult.coding_passed / finalResult.coding_total * 100) : 0}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Coding Score</div>
            <div className="text-xs text-slate-500">{finalResult.coding_passed}/{finalResult.coding_total} passed</div>
          </div>
        )}
      </div>
      <button onClick={() => {
        setPhase('intro'); setMcqAnswers({}); setMcqSubmitted(false);
        setMcqResult(null); setCodes({}); setRunResults({}); setFinalResult(null);
        // Reload to show updated previous_submission
        api.getAssignment(topicId).then(setData).catch(() => {});
      }}
        className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-sm transition">
        <RotateCcw className="w-4 h-4"/>Try Again
      </button>
    </div>
  );

  return null;
}

// ── TopicView main ─────────────────────────────────────────────────────────
export const TopicView = ({ topicKey, onBack, onOpenAITutor }: any) => {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'content' | 'practice' | 'assignment'>('content');

  useEffect(() => {
    api.getTopicDetail(topicKey).then((t: any) => {
      setTopic(t);
      return api.getTopicQuestions(t.id);
    }).then(setQuestions).catch(console.error);
  }, [topicKey]);

  if (!topic) return <div className="text-slate-400 p-8 text-center">Loading...</div>;

  const tabs = [
    { key: 'content', label: '📖 Content' },
    { key: 'practice', label: '💻 Practice' },
    { key: 'assignment', label: '📝 Assignment' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Back button + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3">
            <ArrowLeft className="w-4 h-4"/>Back
          </button>
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          <p className="text-slate-400 mt-1 text-sm">{(topic as any).category} · {(topic as any).difficulty}</p>
          {(topic as any).description && (
            <p className="text-slate-300 text-sm mt-2 max-w-2xl">{(topic as any).description}</p>
          )}
        </div>
        <button onClick={() => onOpenAITutor({ topicTitle: topic.title })}
          className="shrink-0 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4"/>Ask AI
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-navy-800 border border-navy-700 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveSection(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              activeSection === t.key ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content section */}
      {activeSection === 'content' && (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 space-y-5">
          {(topic as any).content ? (
            <>
              {[
                { key: 'intro_what', label: 'What is it?' },
                { key: 'intro_why', label: 'Why it matters' },
                { key: 'placement_importance', label: 'Placement Importance' },
                { key: 'concept_explanation', label: 'Concept Explanation' },
              ].map(s => {
                const val = (topic as any).content[s.key];
                return val ? (
                  <section key={s.key}>
                    <h3 className="font-semibold mb-2 text-brand-300">{s.label}</h3>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{val}</p>
                  </section>
                ) : null;
              })}
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No detailed content available yet.</p>
              <p className="text-xs mt-1">Click "Ask AI" to learn about this topic.</p>
            </div>
          )}
        </div>
      )}

      {/* Practice section */}
      {activeSection === 'practice' && (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-5 h-5 text-cyan-400"/>
            <h2 className="text-lg font-bold">Practice Questions</h2>
            <span className="text-xs text-slate-500">{questions.length} questions</span>
          </div>
          {questions.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No practice questions yet.</p>
          ) : (
            questions.map(q => (
              <div key={q.id} className="bg-navy-900/60 border border-navy-700 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{q.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{q.type} · {q.difficulty}</div>
                </div>
                <button className="px-3 py-1.5 text-xs bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold transition">
                  Solve
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assignment section */}
      {activeSection === 'assignment' && (
        <AssignmentSection topicId={(topic as any).id} topicTitle={topic.title}/>
      )}
    </div>
  );
};
