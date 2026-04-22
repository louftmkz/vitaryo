import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const days = Math.max(1, Math.min(60, Number(req.nextUrl.searchParams.get('days') || 14)));
  const since = subDays(new Date(), days);
  const intakes = await prisma.intake.findMany({
    where: { scheduledFor: { gte: since } },
    include: { vitamin: true },
    orderBy: { scheduledFor: 'desc' },
  });
  const byDay: Record<string, any[]> = {};
  for (const i of intakes) {
    if (!byDay[i.dayKey]) byDay[i.dayKey] = [];
    byDay[i.dayKey].push({
      id: i.id,
      name: i.vitamin.name,
      emoji: i.vitamin.emoji,
      scheduledFor: i.scheduledFor,
      takenAt: i.takenAt,
    });
  }
  return NextResponse.json({ days, byDay });
}
