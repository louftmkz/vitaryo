import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureIntakesForHorizon } from '@/lib/generate-intakes';
import { dayKey } from '@/lib/time';
import { getStreakFast } from '@/lib/achievements';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Cached on warm container — first call after a deploy or after a vitamin
  // change forces work, every subsequent page-load is a no-op.
  await ensureIntakesForHorizon();

  const qDay = req.nextUrl.searchParams.get('day');
  const dk = qDay && /^\d{4}-\d{2}-\d{2}$/.test(qDay) ? qDay : dayKey();

  // Combined response: intakes + streak in one round-trip.
  const [intakes, streak] = await Promise.all([
    prisma.intake.findMany({
      where: { dayKey: dk },
      include: { vitamin: true },
      orderBy: { scheduledFor: 'asc' },
    }),
    getStreakFast(),
  ]);

  return NextResponse.json({ dayKey: dk, intakes, streak });
}
