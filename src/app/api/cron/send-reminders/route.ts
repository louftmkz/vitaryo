import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPushToAll } from '@/lib/push';
import { ensureIntakesForHorizon } from '@/lib/generate-intakes';
import { FORM_LABELS_DE } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Runs every 5 min (configured in vercel.json).
 * Sends a push per intake where:
 *   - now >= scheduledFor - leadTimeMin  AND
 *   - intake not yet taken AND
 *   - intake not yet notified (or snooze expired and not yet snooze-notified)
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  await ensureIntakesForHorizon();
  const now = new Date();

  // Window: from (now - 24h) to (now + 2h) — generous lookback.
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const candidates = await prisma.intake.findMany({
    where: {
      scheduledFor: { gte: from, lte: to },
      takenAt: null,
    },
    include: { vitamin: true },
  });

  let sent = 0;
  for (const intake of candidates) {
    const v = intake.vitamin;
    const lead = (v.leadTimeMin || 0) * 60 * 1000;
    const notifyAt = new Date(intake.scheduledFor.getTime() - lead);
    const isDue = now >= notifyAt;

    // Handle initial notification.
    if (isDue && !intake.notified) {
      const hh = intake.scheduledFor.toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit', timeZone: process.env.APP_TIMEZONE || 'Europe/Berlin',
      });
      const formLabel = FORM_LABELS_DE[v.form] || '';
      const emoji = v.emoji || '💊';
      const body = [v.dose, formLabel ? `(${formLabel})` : null, v.note ? `· ${v.note}` : null]
        .filter(Boolean).join(' ');
      await sendPushToAll({
        title: `${emoji} ${v.name} · ${hh}`,
        body: body || 'Zeit für deine Einnahme',
        url: '/',
        intakeId: intake.id,
        tag: `intake-${intake.id}`,
      });
      await prisma.intake.update({ where: { id: intake.id }, data: { notified: true } });
      sent++;
      continue;
    }

    // Handle snooze follow-up.
    if (intake.snoozedUntil && now >= intake.snoozedUntil && !intake.snoozeNotified) {
      const emoji = v.emoji || '💊';
      await sendPushToAll({
        title: `${emoji} Snooze vorbei: ${v.name}`,
        body: 'Nochmal dran denken – du schaffst das 💚',
        url: '/',
        intakeId: intake.id,
        tag: `intake-snooze-${intake.id}`,
      });
      await prisma.intake.update({ where: { id: intake.id }, data: { snoozeNotified: true } });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, processed: candidates.length, sent });
}

export const POST = GET;
