import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPushToAll } from '@/lib/push';
import { ensureIntakesForTodayFast } from '@/lib/generate-intakes';
import { activeBucketNow, bucketForVitamin, todayDayKey } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Bucket-based reminder cron.
 *
 * Designed to be called on any frequency (every 5 min is fine). The handler
 * does almost no work except in the hour matching a bucket (09:00 morning,
 * 13:00 noon, 19:00 evening Berlin time). When the current Berlin hour
 * matches a bucket, it sends ONE grouped push listing every still-open,
 * still-unnotified intake whose vitamin maps to that bucket — then flips
 * `notified = true` on those intakes so the next cron run in the same hour
 * is a cheap no-op.
 *
 * This avoids the previous design's per-intake push + 26h findMany window
 * that ran on every 5-min tick.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const bucket = activeBucketNow();
  if (!bucket) {
    // Cheapest possible path — no DB hits when nothing is due.
    return NextResponse.json({ ok: true, skipped: 'no active bucket' });
  }

  await ensureIntakesForTodayFast();
  const dk = todayDayKey();

  const candidates = await prisma.intake.findMany({
    where: { dayKey: dk, takenAt: null, notified: false },
    include: { vitamin: true },
  });

  const dueInBucket = candidates.filter(
    (i) => bucketForVitamin(i.vitamin) === bucket.key,
  );
  if (dueInBucket.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'nothing due', bucket: bucket.key });
  }

  const list = dueInBucket
    .map((i) => `${i.vitamin.emoji || '💊'} ${i.vitamin.name}`)
    .join(' · ');
  const count = dueInBucket.length;
  const title = `${bucket.label} · ${count} Vitamin${count === 1 ? '' : 'e'}`;

  await sendPushToAll({
    title,
    body: list,
    url: '/',
    tag: `bucket-${dk}-${bucket.key}`,
  });

  await prisma.intake.updateMany({
    where: { id: { in: dueInBucket.map((i) => i.id) } },
    data: { notified: true },
  });

  return NextResponse.json({ ok: true, bucket: bucket.key, sent: count });
}

export const POST = GET;
