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

/** Ensure intakes for today and tomorrow so the cron doesn't miss an early-morning push. */
export async function ensureIntakesForHorizon() {
  await ensureIntakesForDayKey(todayDayKey());
  await ensureIntakesForDayKey(dayKeyOffset(1));
}
