'use client';
import { TAG_LABELS_DE } from '@/lib/conflicts';

type Intake = {
  id: string;
  scheduledFor: string;
  takenAt: string | null;
  vitamin: { id: string; name: string; warnings: string[] };
};

/**
 * Live-checks today's schedule for timing conflicts.
 * If Eisen is scheduled within 3h of Calcium for instance, show a gentle hint.
 */
export default function ConflictHint({ intakes }: { intakes: Intake[] }) {
  const issues: string[] = [];
  const sorted = intakes.slice().sort((a,b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor));

  // Very light pairwise check.
  const rules: Array<[string, string, number, string]> = [
    ['iron','calcium',180,'Eisen & Calcium brauchen mind. 3 Std. Abstand'],
    ['iron','zinc',120,'Eisen & Zink brauchen mind. 2 Std. Abstand'],
    ['iron','magnesium',120,'Eisen & Magnesium brauchen mind. 2 Std. Abstand'],
    ['iron','coffee',60,'Eisen & Kaffee brauchen mind. 1 Std. Abstand'],
  ];
  for (let i=0;i<sorted.length;i++) {
    for (let j=i+1;j<sorted.length;j++) {
      const a = sorted[i], b = sorted[j];
      const diffMin = Math.abs(+new Date(a.scheduledFor) - +new Date(b.scheduledFor)) / 60000;
      for (const [x,y,m,text] of rules) {
        if (((a.vitamin.warnings||[]).includes(x) && (b.vitamin.warnings||[]).includes(y)) ||
            ((a.vitamin.warnings||[]).includes(y) && (b.vitamin.warnings||[]).includes(x))) {
          if (diffMin < m) issues.push(`${text} (aktuell: ${a.vitamin.name} & ${b.vitamin.name})`);
        }
      }
    }
  }

  if (issues.length === 0) return null;
  const unique = Array.from(new Set(issues));

  return (
    <div className="rounded-bubble bg-peach-50 border border-peach-100 px-4 py-3 animate-fade-up">
      <div className="flex items-center gap-2 text-peach-500 font-semibold text-[13px] mb-1">
        <span>💡</span>
        <span>Abstände beachten</span>
      </div>
      <ul className="text-[12px] text-ink-soft space-y-0.5">
        {unique.slice(0,3).map((t, i) => <li key={i}>· {t}</li>)}
      </ul>
    </div>
  );
}
