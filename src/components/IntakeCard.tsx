'use client';
import { useEffect, useState } from 'react';
import { FORM_LABELS_DE } from '@/lib/time';
import { TAG_LABELS_DE } from '@/lib/conflicts';

type Vitamin = {
  id: string;
  name: string;
  dose: string | null;
  form: string;
  note: string | null;
  emoji: string | null;
  color: string | null;
  warnings: string[];
};

type Intake = {
  id: string;
  scheduledFor: string;
  takenAt: string | null;
  snoozedUntil: string | null;
  vitamin: Vitamin;
};

const COLOR_MAP: Record<string, { bg: string; pill: string; text: string }> = {
  peach:  { bg: 'bg-peach-50',  pill: 'bg-peach-100',  text: 'text-peach-500' },
  sage:   { bg: 'bg-sage-50',   pill: 'bg-sage-100',   text: 'text-sage-500' },
  mauve:  { bg: 'bg-mauve-50',  pill: 'bg-mauve-100',  text: 'text-mauve-400' },
  butter: { bg: 'bg-butter-100',pill: 'bg-butter-200', text: 'text-[#9a7b25]' },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function IntakeCard({
  intake,
  onChange,
  onOptimisticChange,
  allowSnooze = true,
}: {
  intake: Intake;
  onChange: () => void;
  onOptimisticChange?: (id: string, taken: boolean) => void;
  allowSnooze?: boolean;
}) {
  const [checked, setChecked] = useState(!!intake.takenAt);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);
  const v = intake.vitamin;
  const palette = COLOR_MAP[v.color || 'peach'] || COLOR_MAP.peach;

  // Keep local checked state in sync when the parent reloads with new data
  // (e.g. after navigating between days, or background refetch).
  useEffect(() => {
    setChecked(!!intake.takenAt);
  }, [intake.takenAt, intake.id]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setPop(true);
    setTimeout(() => setPop(false), 300);
    const nextChecked = !checked;
    // Optimistic: flip the checkbox + tell the parent to update progress/streak.
    setChecked(nextChecked);
    onOptimisticChange?.(intake.id, nextChecked);
    try {
      await fetch(`/api/intakes/${intake.id}/taken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggle: true }),
      });
      // Background refresh — but don't block the UI on it. The user's already
      // seen their click reflected.
      onChange();
    } catch (err) {
      // Rollback on failure.
      setChecked(!nextChecked);
      onOptimisticChange?.(intake.id, !nextChecked);
      console.error('toggle failed', err);
    } finally {
      setBusy(false);
    }
  }

  async function snooze() {
    await fetch(`/api/intakes/${intake.id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes: 30 }),
    });
    onChange();
  }

  return (
    <div
      onClick={toggle}
      className={`relative flex items-center gap-3 px-3 py-3 rounded-bubble border transition-all cursor-pointer ${
        checked
          ? 'bg-sage-50/80 border-sage-100'
          : `${palette.bg} border-white/50`
      } ${pop ? 'animate-pop' : ''}`}
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${
          checked ? 'bg-sage-200 text-white' : palette.pill
        }`}
      >
        {checked ? '✓' : v.emoji || '💊'}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-1.5 ${checked ? 'text-ink-mute line-through' : 'text-ink'}`}>
          <span className="font-semibold text-[15px] truncate">{v.name}</span>
          <span className="text-xs text-ink-mute shrink-0">· {fmtTime(intake.scheduledFor)}</span>
        </div>
        <div className="text-xs text-ink-soft truncate">
          {[v.dose, FORM_LABELS_DE[v.form]].filter(Boolean).join(' · ')}
          {v.note && <span className="italic"> · {v.note}</span>}
        </div>
        {!checked && v.warnings && v.warnings.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {v.warnings.slice(0,3).map((w) => (
              <span key={w} className="text-[10px] leading-tight bg-white/70 text-ink-soft px-2 py-0.5 rounded-full border border-peach-100">
                ⚠ {TAG_LABELS_DE[w] || w}
              </span>
            ))}
          </div>
        )}
      </div>

      {!checked && allowSnooze && (
        <button
          onClick={(e) => { e.stopPropagation(); snooze(); }}
          className="shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-full bg-white/70 text-ink-soft hover:bg-white"
        >
          +30
        </button>
      )}
    </div>
  );
}
