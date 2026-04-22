import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const minutes = Number(body?.minutes) || 30;
  const until = new Date(Date.now() + minutes * 60 * 1000);
  const updated = await prisma.intake.update({
    where: { id: params.id },
    data: { snoozedUntil: until, snoozeNotified: false },
  });
  return NextResponse.json(updated);
}
