import { prisma } from './db';
import { dayKey, dayKeyOffset, isDueOnDayKey, scheduledForOnDayKey, todayDayKey } from './time';

/** For a given YYYY-MM-DD (in APP_TIMEZONE), ensure an Intake row per due Vitamin. Idempotent. */
export async function ensureIntakesForDayKey(dk: string) {
  const vitamins = await prisma.vitamin.findMany({ where: { active: true } });
  for (const v of vitamins) {
    if (!isDueOnDayKey(v, dk)) continue;
    const scheduledFor = scheduledForOnDayKey(v, dk);
    await prisma.intake.upsert({
      where: { vitaminId_scheduledFor: { vitaminId: v.id, scheduledFor } },
      update: {},
      create: { vitaminId: v.id, scheduledFor, dayKey: dk },
    });
  }
}

// Per-instance memo. On a fresh serverless container we run ensureIntakes once
// per (dayKey, vitamin set version) and skip on every subsequent request that
// hits the same warm container.
const lastEnsuredFor = new Map<string, number>();
// Re-check when this many ms passed since the last ensure for the same key.
// Short TTL means: a freshly added vitamin in /settings shows up on the next
// page load; a no-op refresh skips the work entirely.
const ENSURE_TTL_MS = 60_000;

/**
 * Ensure intakes for today and tomorrow so the cron doesn't miss an early-morning push.
 * Cached for ENSURE_TTL_MS per warm container — page loads are nearly free,
 * the cron path passes force=true to always run.
 */
export async function ensureIntakesForHorizon(opts?: { force?: boolean }) {
  const today = todayDayKey();
  const tomorrow = dayKeyOffset(1);
  const cacheKey = `${today}|${tomorrow}`;
  const now = Date.now();
  const last = lastEnsuredFor.get(cacheKey);
  if (!opts?.force && last && now - last < ENSURE_TTL_MS) {
    return;
  }
  await ensureIntakesForDayKey(today);
  await ensureIntakesForDayKey(tomorrow);
  lastEnsuredFor.set(cacheKey, now);
}
