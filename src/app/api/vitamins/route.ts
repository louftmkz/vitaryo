import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureIntakesForHorizon } from '@/lib/generate-intakes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const vitamins = await prisma.vitamin.findMany({
    orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(vitamins);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.vitamin.create({
    data: {
      name: body.name,
      dose: body.dose || null,
      form: body.form || 'pill',
      timeOfDay: body.exactTime ? null : body.timeOfDay || 'breakfast',
      exactTime: body.exactTime || null,
      intervalEvery: Number(body.intervalEvery) || 1,
      intervalUnit: body.intervalUnit || 'day',
      leadTimeMin: Number(body.leadTimeMin) || 0,
      note: body.note || null,
      emoji: body.emoji || null,
      color: body.color || null,
      warnings: Array.isArray(body.warnings) ? body.warnings : [],
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      sortOrder: Number(body.sortOrder) || 0,
    },
  });
  // New vitamin → bypass cache so today/tomorrow intakes are generated now.
  await ensureIntakesForHorizon({ force: true });
  return NextResponse.json(created, { status: 201 });
}
