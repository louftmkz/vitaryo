import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays } from 'date-fns';

export const TZ = process.env.APP_TIMEZONE || 'Europe/Berlin';

/** "YYYY-MM-DD" key for a given instant, in APP_TIMEZONE. Defaults to now. */
export function dayKey(d: Date = new Date()): string {
  return formatInTimeZone(d, TZ, 'yyyy-MM-dd');
}

export function weekdayShortDe(d: Date = new Date()): string {
  const idx = Number(formatInTimeZone(d, TZ, 'i')); // 1-7, Monday=1
  const map = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  return map[idx - 1];
}

export function weekdayLongDe(d: Date = new Date()): string {
  const idx = Number(formatInTimeZone(d, TZ, 'i'));
  const map = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
  return map[idx - 1];
}

export function formatDateDe(d: Date = new Date()): string {
  return formatInTimeZone(d, TZ, 'd. MMMM yyyy');
}

export const DAYPART_TIMES: Record<string, string> = {
  morning: '07:30',
  breakfast: '08:30',
  noon: '12:30',
  afternoon: '15:30',
  evening: '19:00',
  night: '21:30',
};

export const DAYPART_LABELS_DE: Record<string, string> = {
  morning: 'Morgens (nüchtern)',
  breakfast: 'Frühstück',
  noon: 'Mittags',
  afternoon: 'Nachmittags',
  evening: 'Abends',
  night: 'Nacht',
};

export const FORM_LABELS_DE: Record<string, string> = {
  pill: 'Pille',
  tablet: 'Tablette',
  capsule: 'Kapsel',
  drops: 'Tropfen',
  powder: 'Pulver',
  liquid: 'Flüssigkeit',
  gummy: 'Gummi',
  spray: 'Spray',
  other: 'Andere',
};

/** Today's date as YYYY-MM-DD in APP_TIMEZONE. */
export function todayDayKey(): string {
  return dayKey(new Date());
}

/** Yesterday, tomorrow etc. as YYYY-MM-DD in APP_TIMEZONE, offset from today. */
export function dayKeyOffset(offset: number): string {
  // Resolve "midnight in TZ today + offset days" → ISO string, then format.
  const midnightUtc = fromZonedTime(`${todayDayKey()}T00:00:00`, TZ);
  const shifted = addDays(midnightUtc, offset);
  return dayKey(shifted);
}

/**
 * Is this vitamin due on the given local day (YYYY-MM-DD) given its interval rule?
 * Daily: every N days from startDate.
 * Weekly: every N weeks on same weekday.
 * Monthly: every N months on same day-of-month.
 */
export function isDueOnDayKey(
  v: { startDate: Date; intervalEvery: number; intervalUnit: string },
  dk: string,
): boolean {
  const every = Math.max(1, v.intervalEvery || 1);

  const startKey = dayKey(v.startDate);
  if (dk < startKey) return false;

  // Compute UTC midnights for both days in TZ and use difference for calendar math.
  const startUtc = fromZonedTime(`${startKey}T00:00:00`, TZ);
  const targetUtc = fromZonedTime(`${dk}T00:00:00`, TZ);
  const days = differenceInCalendarDays(targetUtc, startUtc);

  switch (v.intervalUnit) {
    case 'day':
      return days >= 0 && days % every === 0;
    case 'week':
      return days >= 0 && days % 7 === 0 && (days / 7) % every === 0;
    case 'month': {
      const sY = Number(startKey.slice(0, 4));
      const sM = Number(startKey.slice(5, 7));
      const sD = Number(startKey.slice(8, 10));
      const tY = Number(dk.slice(0, 4));
      const tM = Number(dk.slice(5, 7));
      const tD = Number(dk.slice(8, 10));
      const months = (tY - sY) * 12 + (tM - sM);
      return months >= 0 && months % every === 0 && tD === sD;
    }
    default:
      return true;
  }
}

/**
 * Compute the scheduled UTC Date for a vitamin on a given YYYY-MM-DD day in APP_TIMEZONE.
 * Uses exactTime if set, otherwise DAYPART_TIMES[timeOfDay].
 */
export function scheduledForOnDayKey(
  v: { exactTime?: string | null; timeOfDay?: string | null },
  dk: string,
): Date {
  const hhmm = v.exactTime || (v.timeOfDay ? DAYPART_TIMES[v.timeOfDay] : null) || '09:00';
  return fromZonedTime(`${dk}T${hhmm}:00`, TZ);
}
