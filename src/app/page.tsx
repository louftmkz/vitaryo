'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IntakeCard from '@/components/IntakeCard';
import ConflictHint from '@/components/ConflictHint';
import PushPrompt from '@/components/PushPrompt';

type Intake = any;

const WEEKDAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

/** How many days back the user can navigate and edit. */
const EDIT_WINDOW_DAYS = 7;

function todayLocalKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(k: string): Date {
  return new Date(k + 'T00:00:00');
}

function addDaysToKey(k: string, delta: number): string {
  const d = parseKey(k);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function keyDiffDays(a: string, b: string): number {
  return Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / 86400000);
}

export default function Home() {
  const [viewedDay, setViewedDay] = useState<string>(todayLocalKey());
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number | null>(null);

  const diff = keyDiffDays(viewedDay, todayLocalKey()); // 0 = today, negative = past
  const isToday = diff === 0;
  const isYesterday = diff === -1;
  const canGoBack = -diff < EDIT_WINDOW_DAYS - 1;
  const canGoForward = !isToday;

  async function load(dk: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/intakes/today?day=${dk}`);
      const j = await r.json();
      setIntakes(j.intakes || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadStreak() {
    try {
      const r = await fetch('/api/achievements');
      const j = await r.json();
      setStreak(j?.stats?.streak ?? 0);
    } catch {}
  }

  useEffect(() => {
    load(viewedDay);
  }, [viewedDay]);

  useEffect(() => {
    loadStreak();
  }, []);

  function reload() {
    load(viewedDay);
    loadStreak();
  }

  const total = intakes.length;
  const taken = intakes.filter((i: any) => !!i.takenAt).length;
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  const done = total > 0 && taken === total;

  const groups: Record<string, Intake[]> = { morning: [], midday: [], evening: [] };
  for (const i of intakes) {
    const h = new Date(i.scheduledFor).getHours();
    if (h < 11) groups.morning.push(i);
    else if (h < 17) groups.midday.push(i);
    else groups.evening.push(i);
  }

  const viewedDate = parseKey(viewedDay);
  const dateText = `${WEEKDAYS[viewedDate.getDay()]}, ${viewedDate.getDate()}. ${MONTHS[viewedDate.getMonth()]}`;
  const bigTitle = isToday
    ? 'Hallo Layo 💛'
    : isYesterday
    ? 'Gestern'
    : dateText;

  return (
    <main className="px-4 pt-3 pb-6">
      {/* Top row: date nav (left) + streak + settings (right) */}
      <div className="flex items-center justify-between mb-2 animate-fade-up">
        <div className="flex items-center gap-1">
          <button
            onClick={() => canGoBack && setViewedDay(addDaysToKey(viewedDay, -1))}
            disabled={!canGoBack}
            aria-label="Vorheriger Tag"
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
              canGoBack
                ? 'bg-white/70 border border-peach-100 text-ink-soft active:scale-95'
                : 'bg-transparent border border-transparent text-ink-mute/30'
            }`}
          >
            ←
          </button>
          <div className="text-[11px] font-semibold text-ink-mute tracking-wide uppercase px-1.5">
            {dateText}
          </div>
          <button
            onClick={() => canGoForward && setViewedDay(addDaysToKey(viewedDay, +1))}
            disabled={!canGoForward}
            aria-label="Nächster Tag"
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
              canGoForward
                ? 'bg-white/70 border border-peach-100 text-ink-soft active:scale-95'
                : 'bg-transparent border border-transparent text-ink-mute/30'
            }`}
          >
            →
          </button>
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
      </div>

      {/* Greeting */}
      <header className="mb-3 animate-fade-up">
        <h1 className="font-display text-[26px] leading-tight text-ink">{bigTitle}</h1>
        {!isToday && (
          <div className="text-xs text-ink-soft mt-0.5">
            {isYesterday ? 'Nachträglich bearbeiten möglich' : 'Vergangener Tag'}
          </div>
        )}
      </header>

      {/* Progress card */}
      <section className="bg-white rounded-bubble shadow-soft p-4 mb-3 animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] text-ink-soft font-medium">
            {isToday ? 'Heute' : 'Einnahmen'}
          </div>
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
            🌟 {isToday ? 'Alles erledigt – du bist großartig!' : 'Dieser Tag ist komplett!'}
          </div>
        )}
      </section>

      {isToday && (
        <div className="mb-3">
          <PushPrompt />
        </div>
      )}

      <ConflictHint intakes={intakes} />

      {loading ? (
        <div className="mt-4 space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-16 rounded-bubble bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : intakes.length === 0 ? (
        <EmptyState isToday={isToday} />
      ) : (
        <div className="mt-3 space-y-5">
          <Section title="Morgens" emoji="🌅" items={groups.morning} onChange={reload} allowSnooze={isToday} />
          <Section title="Tagsüber" emoji="☀️" items={groups.midday} onChange={reload} allowSnooze={isToday} />
          <Section title="Abends" emoji="🌙" items={groups.evening} onChange={reload} allowSnooze={isToday} />
        </div>
      )}
    </main>
  );
}

function Section({ title, emoji, items, onChange, allowSnooze }: { title: string; emoji: string; items: any[]; onChange: () => void; allowSnooze: boolean }) {
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
          <IntakeCard key={i.id} intake={i} onChange={onChange} allowSnooze={allowSnooze} />
        ))}
      </div>
    </section>
  );
}

function EmptyState({ isToday }: { isToday: boolean }) {
  if (!isToday) {
    return (
      <div className="text-center py-10 animate-fade-up">
        <div className="text-4xl mb-2">🌙</div>
        <div className="text-sm text-ink-soft">Keine Einnahmen an diesem Tag</div>
      </div>
    );
  }
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
