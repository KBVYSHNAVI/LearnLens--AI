import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, Play, CheckCircle2, XCircle, Award } from 'lucide-react';

export const CodingArena = ({ onOpenAITutor }: any) => {
  const [lang, setLang] = useState('python');
  const [code, setCode] = useState('nums = list(map(int, input().split()))\nprint(max(nums))\n');
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  // Auto-load question 2 (Find Maximum Element) which is seeded
  const [qid, setQid] = useState<number>(2);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.submitCode(qid, lang, code);
      setResult(r);
    } catch (e: any) {
      setResult({ status: 'Error', feedback: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coding Arena</h1>
        <button onClick={() => onOpenAITutor({ code, language: lang })}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Get Hint
        </button>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4">
          <h2 className="font-bold mb-3">Problem: Find Maximum Element</h2>
          <p className="text-sm text-slate-300">
            Read space-separated integers from stdin and print the maximum.
          </p>
          <div className="mt-3 text-xs text-slate-400">
            Sample input: <code className="bg-navy-800 px-1 rounded">3 7 2 9 5</code><br />
            Sample output: <code className="bg-navy-800 px-1 rounded">9</code>
          </div>
        </div>
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="bg-navy-800 border border-navy-700 rounded px-2 py-1 text-sm">
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button onClick={submit} disabled={busy}
              className="ml-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-sm flex items-center gap-2">
              <Play className="w-4 h-4" /> {busy ? 'Running...' : 'Submit'}
            </button>
          </div>
          <textarea value={code} onChange={e => setCode(e.target.value)} rows={14}
            className="w-full bg-navy-950 border border-navy-700 rounded p-3 font-mono text-sm" />
        </div>
      </div>
      {result && (
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Results</h3>
            <span className={result.status === 'Passed' ? 'text-emerald-400' : 'text-rose-400'}>
              {result.status}
            </span>
          </div>
          {result.points_awarded > 0 && (
            <div className="text-amber-400 text-sm flex items-center gap-2 mb-2">
              <Award className="w-4 h-4" /> +{result.points_awarded} points! Total: {result.total_points}
            </div>
          )}
          {result.new_badges?.length > 0 && (
            <div className="text-sm bg-amber-600/20 border border-amber-600/40 rounded p-2 mb-2">
              🎉 New badge: <strong>{result.new_badges.map((b: any) => b.title).join(', ')}</strong>
            </div>
          )}
          {result.test_results?.map((t: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              {t.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-rose-400" />}
              Case {t.test_case_number}: {t.passed ? 'Passed' : 'Failed'}
              {!t.passed && !t.is_hidden && (
                <span className="text-xs text-slate-400">
                  (expected {t.expected_output}, got {t.actual_output})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};