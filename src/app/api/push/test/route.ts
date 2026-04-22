import { NextResponse } from 'next/server';
import { sendPushToAll } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = await sendPushToAll({
    title: 'Vitaryo 💊',
    body: 'Test-Push erfolgreich – alles bereit!',
    url: '/',
    tag: 'vitaryo-test',
  });
  return NextResponse.json(res);
}
