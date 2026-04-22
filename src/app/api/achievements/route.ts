import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStats, recomputeAchievements } from '@/lib/achievements';

export const dynamic = 'force-dynamic';

export async function GET() {
  await recomputeAchievements();
  const [stats, achievements] = await Promise.all([
    getStats(),
    prisma.achievement.findMany({ orderBy: { unlockedAt: 'desc' } }),
  ]);
  return NextResponse.json({ stats, achievements });
}
