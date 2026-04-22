import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { endpoint, keys, userAgent } = body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'invalid subscription' }, { status: 400 });
  }
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  if (existing) {
    const updated = await prisma.pushSubscription.update({
      where: { endpoint },
      data: { p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent || null },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  }
  const created = await prisma.pushSubscription.create({
    data: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent || null },
  });
  return NextResponse.json({ ok: true, id: created.id });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const endpoint = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: 'missing endpoint' }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
