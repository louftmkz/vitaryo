import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureIntakesForHorizon } from '@/lib/generate-intakes';
import { dayKey } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureIntakesForHorizon();
  const dk = dayKey();
  const intakes = await prisma.intake.findMany({
    where: { dayKey: dk },
    include: { vitamin: true },
    orderBy: { scheduledFor: 'asc' },
  });
  return NextResponse.json({ dayKey: dk, intakes });
}
