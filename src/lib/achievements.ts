import { prisma } from './db';
import { dayKey, TZ } from './time';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';

export type AchievementSpec = {
  key: string;
  title: string;
  description: string;
  icon: string;
};

/**
 * Recompute which achievements the user has earned.
 * Idempotent — only inserts new ones.
 */
export async function recomputeAchievements(): Promise<AchievementSpec[]> {
  const newlyUnlocked: AchievementSpec[] = [];

  // Pull last 120 days of intakes.
  const since = subDays(new Date(), 120);
  const intakes = await prisma.intake.findMany({
    where: { scheduledFor: { gte: since } },
    select: { dayKey: true, takenAt: true, scheduledFor: true },
    orderBy: { scheduledFor: 'asc' },
  });

  // Group per dayKey: total vs taken.
  const perDay = new Map<string, { total: number; taken: number }>();
  for (const i of intakes) {
    const bucket = perDay.get(i.dayKey) || { total: 0, taken: 0 };
    bucket.total++;
    if (i.takenAt) bucket.taken++;
    perDay.set(i.dayKey, bucket);
  }

  const perfectDays: string[] = [];
  for (const [k, v] of perDay.entries()) {
    if (v.total > 0 && v.taken === v.total) perfectDays.push(k);
  }
  perfectDays.sort();

  // Total taken ever (just based on counted intakes, good enough).
  let totalTaken = 0;
  for (const i of intakes) if (i.takenAt) totalTaken++;

  // Current streak of perfect days ending today or yesterday.
  let streak = 0;
  const todayKey = dayKey();
  let cursor = new Date();
  for (let i = 0; i < 120; i++) {
    const k = formatInTimeZone(cursor, TZ, 'yyyy-MM-dd');
    const day = perDay.get(k);
    if (day && day.total > 0 && day.taken === day.total) {
      streak++;
    } else if (k === todayKey) {
      // today not yet complete — don't break streak
    } else {
      break;
    }
    cursor = subDays(cursor, 1);
  }

  // Perfect weeks (ISO weeks where every scheduled day was perfect).
  const perfectWeeks = new Set<string>();
  const byWeek = new Map<string, { total: number; perfect: number }>();
  for (const [k, v] of perDay.entries()) {
    const d = new Date(k + 'T00:00:00');
    const weekLabel = formatInTimeZone(d, TZ, "yyyy-'W'II");
    const b = byWeek.get(weekLabel) || { total: 0, perfect: 0 };
    b.total++;
    if (v.total > 0 && v.taken === v.total) b.perfect++;
    byWeek.set(weekLabel, b);
  }
  for (const [label, b] of byWeek.entries()) {
    if (b.total >= 5 && b.perfect === b.total) perfectWeeks.add(label);
  }

  const candidates: AchievementSpec[] = [];
  if (streak >= 3) candidates.push({ key: 'streak-3', title: '3-Tage-Streak', description: 'Drei Tage in Folge alles eingenommen', icon: '🔥' });
  if (streak >= 7) candidates.push({ key: 'streak-7', title: 'Eine Woche stark', description: 'Sieben Tage in Folge komplett', icon: '✨' });
  if (streak >= 14) candidates.push({ key: 'streak-14', title: 'Zwei Wochen stark', description: '14 Tage in Folge komplett', icon: '🌟' });
  if (streak >= 30) candidates.push({ key: 'streak-30', title: 'Ein Monat stark', description: '30 Tage in Folge komplett', icon: '🏆' });
  if (totalTaken >= 10) candidates.push({ key: 'total-10', title: 'Erste 10', description: '10 Einnahmen erledigt', icon: '🌱' });
  if (totalTaken >= 50) candidates.push({ key: 'total-50', title: 'Halbe Hundert', description: '50 Einnahmen erledigt', icon: '🌸' });
  if (totalTaken >= 100) candidates.push({ key: 'total-100', title: 'Century Mama', description: '100 Einnahmen erledigt', icon: '💎' });
  if (totalTaken >= 500) candidates.push({ key: 'total-500', title: 'Unaufhaltsam', description: '500 Einnahmen erledigt', icon: '👑' });

  for (const w of perfectWeeks) {
    candidates.push({
      key: `perfect-week-${w}`,
      title: `Perfekte Woche ${w.split('-W')[1]}`,
      description: 'Jeden geplanten Tag dieser Woche komplett',
      icon: '🥇',
    });
  }

  for (const c of candidates) {
    try {
      await prisma.achievement.create({ data: c });
      newlyUnlocked.push(c);
    } catch {
      // already exists — ignore
    }
  }
  return newlyUnlocked;
}

export async function getStats() {
  const since = subDays(new Date(), 60);
  const intakes = await prisma.intake.findMany({
    where: { scheduledFor: { gte: since } },
    select: { dayKey: true, takenAt: true },
  });
  const perDay = new Map<string, { total: number; taken: number }>();
  for (const i of intakes) {
    const b = perDay.get(i.dayKey) || { total: 0, taken: 0 };
    b.total++;
    if (i.takenAt) b.taken++;
    perDay.set(i.dayKey, b);
  }
  let streak = 0;
  const todayKey = dayKey();
  let cursor = new Date();
  for (let i = 0; i < 120; i++) {
    const k = formatInTimeZone(cursor, TZ, 'yyyy-MM-dd');
    const day = perDay.get(k);
    if (day && day.total > 0 && day.taken === day.total) streak++;
    else if (k === todayKey) { /* keep */ }
    else break;
    cursor = subDays(cursor, 1);
  }
  const totalTaken = intakes.filter((i) => i.takenAt).length;
  return { streak, totalTaken, perDay: Object.fromEntries(perDay) };
}
