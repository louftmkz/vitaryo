import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureIntakesForHorizon } from '@/lib/generate-intakes';
import { dayKey } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await ensureIntakesForHorizon();
  const qDay = req.nextUrl.searchParams.get('day');
  const dk = qDay && /^\d{4}-\d{2}-\d{2}$/.test(qDay) ? qDay : dayKey();
  const intakes = await prisma.intake.findMany({
    where: { dayKey: dk },
    include: { vitamin: true },
    orderBy: { scheduledFor: 'asc' },
  });
  return NextResponse.json({ dayKey: dk, intakes });
}
