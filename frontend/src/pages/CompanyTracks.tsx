import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Building2 } from 'lucide-react';

export const CompanyTracks = ({ onNavigateToCoding }: any) => {
  const [tracks, setTracks] = useState<any[]>([]);
  useEffect(() => {
    api.getCompanyTracks().then(setTracks).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Company Tracks</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((t, i) => (
          <div key={i} className="bg-navy-850 border border-navy-700 rounded-xl p-5">
            <Building2 className="w-6 h-6 text-brand-400 mb-2" />
            <h2 className="text-lg font-bold">{t.company}</h2>
            <p className="text-xs text-slate-400 mb-2">{t.difficulty}</p>
            <div className="text-sm space-y-1">
              <div><strong>Focus:</strong> {t.focus.join(', ')}</div>
              <div><strong>Rounds:</strong> {t.rounds.join(' → ')}</div>
            </div>
            <button onClick={onNavigateToCoding}
              className="mt-3 w-full px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded text-sm">
              Practice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};