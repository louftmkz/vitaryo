import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { recomputeAchievements } from '@/lib/achievements';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const toggle = body?.toggle === true;

  const existing = await prisma.intake.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const nextTakenAt = toggle
    ? existing.takenAt
      ? null
      : new Date()
    : new Date();

  const updated = await prisma.intake.update({
    where: { id: params.id },
    data: { takenAt: nextTakenAt },
  });

  // Fire-and-forget: don't block the response on the 120-day achievement scan.
  // The user sees the checkbox flip immediately; achievements are recomputed
  // asynchronously and surfaced on the next /api/achievements fetch.
  if (nextTakenAt) {
    recomputeAchievements().catch((err) => {
      console.error('recomputeAchievements failed', err);
    });
  }

  return NextResponse.json({ intake: updated });
}
