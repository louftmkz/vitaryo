import webpush from 'web-push';
import { prisma } from './db';

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@vitaryo.app';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  intakeId?: string;
  tag?: string;
};

/**
 * Send a push to every saved subscription.
 * Prunes dead subscriptions (410/404) automatically.
 */
export async function sendPushToAll(payload: PushPayload) {
  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys missing, skipping send');
    return { sent: 0, pruned: 0 };
  }
  const subs = await prisma.pushSubscription.findMany();
  let sent = 0;
  let pruned = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
          { TTL: 300 }
        );
        sent++;
      } catch (err: any) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          pruned++;
        } else {
          console.error('[push] send error', err?.statusCode, err?.body);
        }
      }
    })
  );
  return { sent, pruned };
}
