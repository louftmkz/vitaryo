import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureIntakesForHorizon } from '@/lib/generate-intakes';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  const keys = ['name','dose','form','timeOfDay','exactTime','intervalEvery','intervalUnit','leadTimeMin','note','emoji','color','warnings','active','sortOrder','startDate'];
  for (const k of keys) {
    if (k in body) {
      if (k === 'startDate') data[k] = new Date(body[k]);
      else if (k === 'intervalEvery' || k === 'leadTimeMin' || k === 'sortOrder') data[k] = Number(body[k]) || 0;
      else data[k] = body[k];
    }
  }
  // If switching to exactTime, clear timeOfDay (and vice-versa) — client may send both intentionally.
  if (data.exactTime) data.timeOfDay = null;
  const updated = await prisma.vitamin.update({ where: { id: params.id }, data });
  // Edited vitamin (timing, schedule, etc.) → bypass cache.
  await ensureIntakesForHorizon({ force: true });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.vitamin.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
