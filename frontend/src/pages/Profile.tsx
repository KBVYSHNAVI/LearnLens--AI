import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, Flame, Star, Trophy, Target } from 'lucide-react';
import { BadgesResponse } from '../types';

export const Profile = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgesResponse | null>(null);

  useEffect(() => {
    if (user) api.getBadges().then(setBadges).catch(console.error);
  }, [user]);

  if (!user) return <div className="text-slate-400">Please sign in.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <div className="bg-navy-850 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-2xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <p className="text-slate-400 text-sm">{user.branch} • {user.graduation_year}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4">
          <Star className="w-5 h-5 text-amber-400 mb-1" />
          <div className="text-2xl font-bold">{user.points || 0}</div>
          <div className="text-xs text-slate-400">Total Points</div>
        </div>
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4">
          <Flame className="w-5 h-5 text-orange-400 mb-1" />
          <div className="text-2xl font-bold">{user.streak_count}</div>
          <div className="text-xs text-slate-400">Day Streak</div>
        </div>
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4">
          <Award className="w-5 h-5 text-brand-400 mb-1" />
          <div className="text-2xl font-bold">{badges?.badges.length || 0}</div>
          <div className="text-xs text-slate-400">Badges Earned</div>
        </div>
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-4">
          <Target className="w-5 h-5 text-emerald-400 mb-1" />
          <div className="text-2xl font-bold">{user.readiness_score}%</div>
          <div className="text-xs text-slate-400">Readiness</div>
        </div>
      </div>

      <div className="bg-navy-850 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold">Badges & Achievements</h2>
        </div>

        {badges?.next_streak_milestone && (
          <div className="mb-4 p-3 bg-orange-600/10 border border-orange-600/30 rounded-lg">
            <p className="text-sm text-orange-300">
              🔥 Keep your streak going! <strong>{badges.days_to_next_badge} more days</strong> until your{' '}
              <strong>{badges.next_streak_milestone}-Day Streak</strong> badge!
            </p>
          </div>
        )}

        {(!badges || badges.badges.length === 0) ? (
          <p className="text-slate-400 text-sm">
            No badges yet. Start solving questions and maintain your streak!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges.badges.map(b => (
              <div key={b.id} className="bg-navy-800 border border-navy-700 rounded-lg p-3 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-sm">{b.title}</div>
                <div className="text-xs text-slate-400 mt-1">{b.description}</div>
                <div className={`mt-1 text-xs px-2 py-0.5 rounded inline-block ${
                  b.tier === 'platinum' ? 'bg-purple-500/20 text-purple-300'
                  : b.tier === 'gold' ? 'bg-amber-500/20 text-amber-300'
                  : b.tier === 'silver' ? 'bg-slate-400/20 text-slate-300'
                  : 'bg-orange-500/20 text-orange-300'
                }`}>{b.tier}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-navy-850 border border-navy-700 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-3">Target Companies</h2>
        <p className="text-slate-300 text-sm">{user.target_companies}</p>
        <h2 className="text-xl font-bold mb-3 mt-4">Learning Goals</h2>
        <p className="text-slate-300 text-sm">{user.learning_goals}</p>
      </div>
    </div>
  );
};