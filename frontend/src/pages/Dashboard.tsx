import React, { useEffect, useState } from 'react';
import { Flame, Target, Award, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const Dashboard = ({ onNavigateToTopic, onNavigateToTab, onOpenAITutor }: any) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    api.getDashboardStats().then(setStats).catch(e => setErr(e.message));
  }, [user]);

  if (!user) return <div className="text-center py-20 text-slate-400">Please sign in to view your dashboard.</div>;
  if (err) return <div className="text-rose-400">{err}</div>;
  if (!stats) return <div className="text-slate-400">Loading...</div>;

  const cards = [
    { icon: Flame, label: 'Streak', value: `${stats.streak_days}d`, color: 'text-orange-400' },
    { icon: Award, label: 'Points', value: stats.total_points, color: 'text-amber-400' },
    { icon: Target, label: 'Solved', value: stats.total_questions_solved, color: 'text-emerald-400' },
    { icon: TrendingUp, label: 'Readiness', value: `${stats.readiness_score}%`, color: 'text-brand-400' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{stats.welcome_message}</h1>
        <p className="text-slate-400 mt-1">Badges earned: {stats.badges_earned}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-navy-850 border border-navy-700 rounded-xl p-4">
              <Icon className={`w-6 h-6 ${c.color} mb-2`} />
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</div>
            </div>
          );
        })}
      </div>

      {stats.recommended_topic && (
        <div className="bg-gradient-to-r from-brand-600/20 to-cyan-600/20 border border-brand-600/40 rounded-xl p-5">
          <div className="flex items-center gap-2 text-brand-300 mb-2">
            <Sparkles className="w-4 h-4" /> Recommended Next
          </div>
          <h3 className="text-xl font-bold">{stats.recommended_topic.title}</h3>
          <p className="text-slate-400 text-sm mt-1">{stats.recommended_topic.reason}</p>
          <button onClick={() => onNavigateToTopic(stats.recommended_topic!.topic_key)}
            className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium inline-flex items-center gap-2">
            Start Learning <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Today's Plan</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {stats.daily_plan.map((p, i) => <li key={i}>• {p}</li>)}
          </ul>
        </div>
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          {stats.recent_activity.length === 0 ? (
            <p className="text-slate-400 text-sm">No activity yet. Solve your first question!</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.recent_activity.map((a, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-slate-400">{a.date}</span>
                  <span>{a.questions_solved} solved</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => onNavigateToTab('coding')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg">Practice Coding</button>
        <button onClick={onOpenAITutor}
          className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg hover:bg-navy-700">
          Ask AI Mentor
        </button>
      </div>
    </div>
  );
};