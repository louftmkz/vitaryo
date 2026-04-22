'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IntakeCard from '@/components/IntakeCard';
import ConflictHint from '@/components/ConflictHint';
import PushPrompt from '@/components/PushPrompt';

type Intake = any;

const WEEKDAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

export default function Home() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number | null>(null);
  const now = new Date();

  async function load() {
    const r = await fetch('/api/intakes/today');
    const j = await r.json();
    setIntakes(j.intakes || []);
    setLoading(false);
  }
  async function loadStreak() {
    try {
      const r = await fetch('/api/achievements');
      const j = await r.json();
      setStreak(j?.stats?.streak ?? 0);
    } catch {}
  }

  useEffect(() => {
    load();
    loadStreak();
  }, []);

  const total = intakes.length;
  const taken = intakes.filter((i: any) => !!i.takenAt).length;
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  const done = total > 0 && taken === total;

  // Group by rough daypart based on local hour of scheduledFor.
  const groups: Record<string, Intake[]> = { morning: [], midday: [], evening: [] };
  for (const i of intakes) {
    const h = new Date(i.scheduledFor).getHours();
    if (h < 11) groups.morning.push(i);
    else if (h < 17) groups.midday.push(i);
    else groups.evening.push(i);
  }

  return (
    <main className="px-4 pt-3 pb-6">
      {/* Top bar */}
      <header className="flex items-center justify-between mb-3 animate-fade-up">
        <div>
          <div className="text-xs font-medium text-ink-mute tracking-wide uppercase">
            {WEEKDAYS[now.getDay()]}, {now.getDate()}. {MONTHS[now.getMonth()]}
          </div>
          <h1 className="font-display text-[26px] leading-tight text-ink">Hallo Layo 💛</h1>
        </div>
        <div className="flex items-center gap-2">
          {streak !== null && streak > 0 && (
            <div className="bg-peach-100 text-peach-500 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
              🔥 <span>{streak}</span>
            </div>
          )}
          <Link href="/settings" className="w-9 h-9 rounded-full bg-white/70 border border-peach-100 flex items-center justify-center text-ink-soft">
            ⚙️
          </Link>
        </div>
      </header>

      {/* Progress card */}
      <section className="bg-white rounded-bubble shadow-soft p-4 mb-3 animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] text-ink-soft font-medium">Heute</div>
          <div className="text-[13px] text-ink font-semibold">{taken} / {total}</div>
        </div>
        <div className="h-2.5 rounded-full bg-peach-50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-peach-300 via-peach-400 to-sage-300 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {done && (
          <div className="mt-3 text-center text-sage-500 font-semibold text-sm animate-fade-up">
            🌟 Alles erledigt – du bist großartig!
          </div>
        )}
      </section>

      <div className="mb-3">
        <PushPrompt />
      </div>

      <ConflictHint intakes={intakes} />

      {loading ? (
        <div className="mt-4 space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-16 rounded-bubble bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : intakes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-3 space-y-5">
          <Section title="Morgens" emoji="🌅" items={groups.morning} onChange={load} />
          <Section title="Tagsüber" emoji="☀️" items={groups.midday} onChange={load} />
          <Section title="Abends" emoji="🌙" items={groups.evening} onChange={load} />
        </div>
      )}
    </main>
  );
}

function Section({ title, emoji, items, onChange }: { title: string; emoji: string; items: any[]; onChange: () => void }) {
  if (items.length === 0) return null;
  return (
    <section className="animate-fade-up">
      <div className="flex items-center gap-2 mb-1.5 px-1">
        <span>{emoji}</span>
        <span className="font-display text-[14px] text-ink-soft">{title}</span>
        <div className="flex-1 h-px bg-peach-100" />
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <IntakeCard key={i.id} intake={i} onChange={onChange} />
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10 animate-fade-up">
      <div className="text-5xl mb-2">🌱</div>
      <div className="font-display text-lg text-ink">Noch keine Vitamine angelegt</div>
      <div className="text-sm text-ink-soft mt-1 mb-4">Leg deine erste Einnahme an – das geht in einer Minute.</div>
      <Link href="/settings" className="inline-block bg-gradient-to-r from-peach-200 to-peach-300 text-ink px-5 py-3 rounded-full font-semibold shadow-bubble">
        + Vitamin hinzufügen
      </Link>
    </div>
  );
}
