'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DayEntry = { id: string; name: string; emoji: string | null; scheduledFor: string; takenAt: string | null };

export default function HistoryPage() {
  const [data, setData] = useState<Record<string, DayEntry[]> | null>(null);
  const [range, setRange] = useState<number>(14);

  async function load(days: number) {
    const r = await fetch(`/api/history?days=${days}`);
    const j = await r.json();
    setData(j.byDay);
  }
  useEffect(() => { load(range); }, [range]);

  const days = data ? Object.keys(data).sort().reverse() : [];

  return (
    <main className="px-4 pt-3 pb-6">
      <header className="flex items-center justify-between mb-4">
        <Link href="/" className="w-9 h-9 rounded-full bg-white/70 border border-peach-100 flex items-center justify-center">←</Link>
        <h1 className="font-display text-xl">Verlauf</h1>
        <div className="w-9"></div>
      </header>

      <div className="flex gap-2 mb-4">
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setRange(d)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold ${range===d ? 'bg-peach-300 text-white' : 'bg-white text-ink-soft'}`}>
            {d} Tage
          </button>
        ))}
      </div>

      {!data ? (
        <div className="space-y-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 rounded-bubble bg-white/60 animate-pulse" />)}
        </div>
      ) : days.length === 0 ? (
        <div className="text-center text-ink-soft py-10">Noch kein Verlauf</div>
      ) : (
        <div className="space-y-3">
          {days.map(k => {
            const entries = data[k];
            const taken = entries.filter(e => e.takenAt).length;
            const total = entries.length;
            const pct = total === 0 ? 0 : Math.round((taken/total)*100);
            const isPerfect = total>0 && taken===total;
            return (
              <div key={k} className="bg-white rounded-bubble shadow-soft p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{formatDayHeader(k)}</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${isPerfect ? 'bg-sage-100 text-sage-500' : 'bg-peach-50 text-peach-500'}`}>
                    {isPerfect ? '✨ ' : ''}{taken}/{total}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-peach-50 overflow-hidden mb-2">
                  <div className={`h-full ${isPerfect ? 'bg-sage-300' : 'bg-gradient-to-r from-peach-300 to-peach-400'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {entries.map(e => (
                    <span key={e.id} className={`text-[11px] px-2 py-1 rounded-full flex items-center gap-1 ${e.takenAt ? 'bg-sage-50 text-sage-500' : 'bg-peach-50 text-ink-mute line-through'}`}>
                      <span>{e.emoji || '💊'}</span>{e.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

const WEEKDAYS_SHORT = ['So','Mo','Di','Mi','Do','Fr','Sa'];
function formatDayHeader(k: string) {
  const d = new Date(k + 'T00:00:00');
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()}.${d.getMonth()+1}.`;
}
