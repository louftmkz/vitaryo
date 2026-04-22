// Smart conflict detection based on warning tags.
// Each vitamin can carry warning tags (e.g. "iron", "calcium", "zinc", "coffee").
// These rules describe how long a tagged vitamin must not be combined with another tag.

export type ConflictRule = {
  a: string;          // tag A
  b: string;          // tag B
  minutes: number;    // minimum separation
  reason?: string;    // short explanation shown to user
};

export const CONFLICT_RULES: ConflictRule[] = [
  { a: 'iron', b: 'calcium', minutes: 180, reason: 'Calcium hemmt die Eisen-Aufnahme' },
  { a: 'iron', b: 'zinc',    minutes: 120, reason: 'Zink und Eisen konkurrieren' },
  { a: 'iron', b: 'magnesium', minutes: 120, reason: 'Magnesium bindet Eisen' },
  { a: 'iron', b: 'coffee',  minutes: 60,  reason: 'Kaffee/Tee blockiert Eisen' },
  { a: 'iron', b: 'dairy',   minutes: 150, reason: 'Milchprodukte hemmen Eisen' },
  { a: 'calcium', b: 'iron', minutes: 180, reason: 'Calcium hemmt die Eisen-Aufnahme' },
  { a: 'zinc', b: 'iron',    minutes: 120, reason: 'Zink und Eisen konkurrieren' },
];

export const TAG_LABELS_DE: Record<string, string> = {
  iron: 'Eisen',
  calcium: 'Calcium',
  zinc: 'Zink',
  magnesium: 'Magnesium',
  coffee: 'Kaffee/Tee',
  dairy: 'Milch',
  vitaminD: 'Vitamin D',
  vitaminC: 'Vitamin C',
  omega3: 'Omega-3',
  b12: 'B12',
  prenatal: 'Pränatal',
};

/** Returns the conflict rules that apply to a vitamin with the given warning tags. */
export function conflictsForTags(tags: string[]): Array<{ otherTag: string; minutes: number; reason?: string }> {
  const seen = new Map<string, { otherTag: string; minutes: number; reason?: string }>();
  for (const t of tags) {
    for (const r of CONFLICT_RULES) {
      if (r.a === t) {
        const existing = seen.get(r.b);
        if (!existing || existing.minutes < r.minutes) {
          seen.set(r.b, { otherTag: r.b, minutes: r.minutes, reason: r.reason });
        }
      }
    }
  }
  return Array.from(seen.values());
}
