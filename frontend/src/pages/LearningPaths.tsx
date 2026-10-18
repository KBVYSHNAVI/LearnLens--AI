import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LearningPath } from '../types';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';

export const LearningPaths = ({ onSelectTopic }: any) => {
  const [paths, setPaths] = useState<LearningPath[]>([]);

  useEffect(() => {
    api.getPaths().then(setPaths).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Learning Paths</h1>
      {paths.map(p => (
        <div key={p.id} className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-brand-400" />
            <div>
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="text-slate-400 text-sm">{p.tagline}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {p.topics.map(t => (
              <button key={t.id} onClick={() => onSelectTopic(t.topic_key)}
                className="text-left bg-navy-800 hover:bg-navy-700 border border-navy-700 rounded-lg p-4 transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{t.title}</h3>
                  {t.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="text-xs text-slate-400 mb-2">{t.category}</div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{t.estimated_minutes}m
                  </span>
                  <span className={`px-2 py-0.5 rounded ${
                    t.difficulty === 'Easy' ? 'bg-emerald-600/20 text-emerald-400'
                    : t.difficulty === 'Medium' ? 'bg-amber-600/20 text-amber-400'
                    : 'bg-rose-600/20 text-rose-400'}`}>{t.difficulty}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};