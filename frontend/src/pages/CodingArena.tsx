import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, Play, CheckCircle2, XCircle, Award, Terminal, Code2, ChevronDown } from 'lucide-react';

export const CodingArena = ({ onOpenAITutor, questionId, onSelectQuestion }: any) => {
  const [qid, setQid] = useState<number>(questionId || 2);
  const [lang, setLang] = useState('python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [runOutput, setRunOutput] = useState<any>(null);
  const [busyRun, setBusyRun] = useState(false);
  const [busySubmit, setBusySubmit] = useState(false);

  // Sync external questionId prop
  useEffect(() => {
    if (questionId && questionId !== qid) {
      setQid(questionId);
    }
  }, [questionId]);

  // Load list of available coding questions for the selector
  useEffect(() => {
    api.getPaths()
      .then(async (paths) => {
        const allQs: any[] = [];
        for (const p of paths) {
          for (const t of p.topics) {
            try {
              const qs = await api.getTopicQuestions(t.id);
              const codingQs = qs.filter((q: any) => q.type !== 'mcq');
              allQs.push(...codingQs);
            } catch {}
          }
        }
        if (allQs.length > 0) {
          setAvailableQuestions(allQs);
          if (!questionId && !allQs.some(q => q.id === qid)) {
            setQid(allQs[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch question details whenever qid changes
  useEffect(() => {
    if (!qid) return;
    setResult(null);
    setRunOutput(null);
    api.getQuestionDetail(qid)
      .then(q => {
        setQuestion(q);
        const starter = lang === 'python'
          ? (q.starter_code_python || 'nums = list(map(int, input().split()))\nprint(max(nums))\n')
          : lang === 'java'
          ? (q.starter_code_java || 'import java.util.*;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner s = new Scanner(System.in);\n  }\n}')
          : (q.starter_code_js || '// Your solution here\nconst fs = require("fs");\n');
        setCode(starter);
      })
      .catch(() => {
        // Fallback default
        if (!code) {
          setCode('nums = list(map(int, input().split()))\nprint(max(nums))\n');
        }
      });
  }, [qid]);

  // Update starter code when language changes
  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    if (question) {
      const starter = newLang === 'python'
        ? (question.starter_code_python || '# Write solution in Python\n')
        : newLang === 'java'
        ? (question.starter_code_java || 'import java.util.*;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner s = new Scanner(System.in);\n  }\n}')
        : (question.starter_code_js || '// Write solution in JavaScript\n');
      setCode(starter);
    }
  };

  const handleSelectQuestion = (newId: number) => {
    setQid(newId);
    onSelectQuestion?.(newId);
  };

  // Run code with custom input
  const handleRun = async () => {
    setBusyRun(true);
    setRunOutput(null);
    try {
      const r = await api.runCode(qid, lang, code, customInput) as any;
      setRunOutput(r);
    } catch (e: any) {
      setRunOutput({ success: false, stderr: e.message || 'Execution error' });
    }
    setBusyRun(false);
  };

  // Submit code against all test cases
  const handleSubmit = async () => {
    setBusySubmit(true);
    setResult(null);
    try {
      const r = await api.submitCode(qid, lang, code);
      setResult(r);
    } catch (e: any) {
      setResult({ status: 'Error', feedback: e.message });
    }
    setBusySubmit(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Coding Arena</h1>
          <p className="text-slate-400 text-sm mt-0.5">Solve coding problems, test edge cases, and run your code</p>
        </div>
        <div className="flex items-center gap-2">
          {availableQuestions.length > 0 && (
            <div className="relative">
              <select
                value={qid}
                onChange={e => handleSelectQuestion(Number(e.target.value))}
                className="appearance-none bg-navy-800 border border-navy-700 text-slate-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-brand-500 font-medium"
              >
                {availableQuestions.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.difficulty})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => onOpenAITutor({ code, language: lang, questionTitle: question?.title, topicTitle: 'Coding Arena' })}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
          >
            <Sparkles className="w-4 h-4" /> Get Hint
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Problem Description Panel */}
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                question?.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-400' :
                question?.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {question?.difficulty || 'Easy'}
              </span>
              {question?.company_tags && question.company_tags.length > 0 && (
                <span className="text-xs text-slate-400 bg-navy-800 px-2 py-0.5 rounded">
                  {question.company_tags.join(', ')}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-white">
              {question?.title || 'Find Maximum Element'}
            </h2>

            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {question?.description || 'Read space-separated integers from stdin and print the maximum element.'}
            </p>

            {question?.test_cases && question.test_cases.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sample Test Cases</div>
                {question.test_cases.filter((tc: any) => !tc.hidden).slice(0, 2).map((tc: any, i: number) => (
                  <div key={i} className="bg-navy-950 border border-navy-750 rounded-lg p-3 text-xs font-mono space-y-1">
                    <div><span className="text-slate-500">Input:</span> <span className="text-cyan-300">{tc.input}</span></div>
                    <div><span className="text-slate-500">Output:</span> <span className="text-emerald-300">{tc.expected || tc.expected_output}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {question?.hints && question.hints.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1">💡 Hints</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {question.hints.map((h: string, idx: number) => (
                  <li key={idx}>{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Code Editor Panel */}
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <select
                value={lang}
                onChange={e => handleLangChange(e.target.value)}
                className="bg-navy-800 border border-navy-700 text-slate-200 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                  showCustomInput ? 'bg-navy-700 border-brand-500 text-brand-300' : 'bg-navy-800 border-navy-700 text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 inline mr-1" /> Custom Input
              </button>
              <button
                onClick={handleRun}
                disabled={busyRun || busySubmit}
                className="px-3 py-1.5 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400" /> {busyRun ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={busyRun || busySubmit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold flex items-center gap-1.5 text-white disabled:opacity-50 transition"
              >
                <Play className="w-3.5 h-3.5" /> {busySubmit ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full bg-navy-950 border border-navy-700 rounded-xl p-3 font-mono text-sm focus:outline-none focus:border-brand-500 resize-y text-green-300"
            placeholder="Write your code here..."
          />

          {showCustomInput && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Custom Input (stdin)</label>
              <textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                rows={3}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-brand-500"
                placeholder="Enter input to pass to your program..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Single Run Output */}
      {runOutput && (
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" /> Execution Output
            </h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${runOutput.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {runOutput.success ? 'Success (Exit 0)' : (runOutput.error_type || 'Error')}
            </span>
          </div>
          {runOutput.stdout && (
            <div>
              <div className="text-xs text-slate-400 mb-1">Stdout:</div>
              <pre className="bg-navy-950 border border-navy-800 rounded-lg p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                {runOutput.stdout}
              </pre>
            </div>
          )}
          {runOutput.stderr && (
            <div>
              <div className="text-xs text-rose-400 mb-1">Stderr:</div>
              <pre className="bg-navy-950 border border-rose-900/40 rounded-lg p-3 font-mono text-xs text-rose-300 whitespace-pre-wrap">
                {runOutput.stderr}
              </pre>
            </div>
          )}
          <div className="text-xs text-slate-500">
            Execution time: {runOutput.execution_time_ms} ms
          </div>
        </div>
      )}

      {/* Submission Results */}
      {result && (
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base">Submission Results</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${result.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              {result.status}
            </span>
          </div>

          {result.points_awarded > 0 && (
            <div className="text-amber-400 text-sm flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <Award className="w-5 h-5 shrink-0" />
              <span>+{result.points_awarded} points awarded! Total Points: <strong>{result.total_points}</strong></span>
            </div>
          )}

          {result.new_badges && result.new_badges.length > 0 && (
            <div className="text-sm bg-amber-600/20 border border-amber-600/40 rounded-lg p-3">
              🎉 New badge unlocked: <strong>{result.new_badges.map((b: any) => b.title).join(', ')}</strong>
            </div>
          )}

          {result.feedback && (
            <div className="text-sm text-slate-300 font-medium">
              {result.feedback}
            </div>
          )}

          {result.test_results && (
            <div className="space-y-2 pt-2">
              {result.test_results.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm bg-navy-950 border border-navy-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    {t.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span className="font-medium">Test Case #{t.test_case_number}</span>
                    {!t.passed && !t.is_hidden && (
                      <span className="text-xs text-slate-400 ml-2">
                        (expected: <code className="text-emerald-400">{t.expected_output}</code>, got: <code className="text-rose-400">{t.actual_output}</code>)
                      </span>
                    )}
                    {t.is_hidden && <span className="text-xs text-slate-500 italic">[Hidden]</span>}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{t.execution_time_ms} ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};