'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Achievement = { id: string; key: string; title: string; description: string; icon: string; unlockedAt: string };

const ALL_BADGES: { key: string; title: string; description: string; icon: string; rarity: number }[] = [
  { key: 'streak-3',   title: '3-Tage-Streak',     description: 'Drei Tage in Folge alles eingenommen', icon: '🔥', rarity: 1 },
  { key: 'streak-7',   title: 'Eine Woche stark',  description: 'Sieben Tage in Folge komplett',        icon: '✨', rarity: 2 },
  { key: 'streak-14',  title: 'Zwei Wochen stark', description: '14 Tage in Folge komplett',            icon: '🌟', rarity: 3 },
  { key: 'streak-30',  title: 'Ein Monat stark',   description: '30 Tage in Folge komplett',            icon: '🏆', rarity: 4 },
  { key: 'total-10',   title: 'Erste 10',          description: '10 Einnahmen erledigt',                 icon: '🌱', rarity: 1 },
  { key: 'total-50',   title: 'Halbe Hundert',     description: '50 Einnahmen erledigt',                 icon: '🌸', rarity: 2 },
  { key: 'total-100',  title: 'Century Mama',      description: '100 Einnahmen erledigt',                icon: '💎', rarity: 3 },
  { key: 'total-500',  title: 'Unaufhaltsam',      description: '500 Einnahmen erledigt',                icon: '👑', rarity: 4 },
];

export default function AchievementsPage() {
  const [data, setData] = useState<{ stats: any; achievements: Achievement[] } | null>(null);

  useEffect(() => {
    fetch('/api/achievements').then(r => r.json()).then(setData);
  }, []);

  const unlockedSet = new Set((data?.achievements || []).map(a => a.key));
  const perfectWeeks = (data?.achievements || []).filter(a => a.key.startsWith('perfect-week-'));

  return (
    <main className="px-4 pt-3 pb-6">
      <header className="flex items-center justify-between mb-4">
        <Link href="/" className="w-9 h-9 rounded-full bg-white/70 border border-peach-100 flex items-center justify-center">←</Link>
        <h1 className="font-display text-xl">Trophäen</h1>
        <div className="w-9"></div>
      </header>

      {/* Stat hero */}
      <div className="bg-gradient-to-br from-peach-100 to-mauve-100 rounded-bubble p-5 mb-4 text-center animate-fade-up">
        <div className="text-5xl mb-1">🔥</div>
        <div className="font-display text-3xl text-ink">{data?.stats?.streak ?? 0}</div>
        <div className="text-xs text-ink-soft uppercase tracking-wider font-semibold mt-1">Tage-Streak</div>
        <div className="mt-3 text-xs text-ink-soft">
          Insgesamt <span className="font-bold text-ink">{data?.stats?.totalTaken ?? 0}</span> Einnahmen erledigt
        </div>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-2 gap-3">
        {ALL_BADGES.map(b => {
          const unlocked = unlockedSet.has(b.key);
          return (
            <div key={b.key} className={`rounded-bubble p-4 text-center shadow-soft transition-all ${unlocked ? 'bg-white' : 'bg-white/50 grayscale opacity-60'}`}>
              <div className="text-4xl mb-1">{b.icon}</div>
              <div className="font-semibold text-sm">{b.title}</div>
              <div className="text-[11px] text-ink-soft mt-1 leading-snug">{b.description}</div>
              {!unlocked && <div className="text-[10px] text-ink-mute mt-2 uppercase tracking-wider">gesperrt</div>}
            </div>
          );
        })}
      </div>

      {perfectWeeks.length > 0 && (
        <section className="mt-5">
          <div className="font-display text-sm text-ink-soft mb-2">Perfekte Wochen</div>
          <div className="flex flex-wrap gap-1.5">
            {perfectWeeks.map(w => (
              <span key={w.id} className="bg-butter-100 text-[#8a6e25] text-xs font-semibold px-3 py-1.5 rounded-full border border-butter-200">
                🥇 Woche {w.key.split('-W')[1]}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
