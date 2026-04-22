'use client';
import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushPrompt() {
  const [state, setState] = useState<'idle' | 'granted' | 'denied' | 'unsupported' | 'subscribed' | 'loading'>('idle');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      // Check existing subscription
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? 'subscribed' : 'granted');
      });
    } else if (Notification.permission === 'denied') {
      setState('denied');
    }
  }, []);

  async function subscribe() {
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'idle');
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        alert('VAPID Public Key fehlt in NEXT_PUBLIC_VAPID_PUBLIC_KEY.');
        setState('granted');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh') as ArrayBuffer)))
              .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
            auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth') as ArrayBuffer)))
              .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          },
          userAgent: navigator.userAgent,
        }),
      });
      setState('subscribed');
    } catch (e) {
      console.error(e);
      setState('idle');
    }
  }

  async function sendTest() {
    await fetch('/api/push/test', { method: 'POST' });
  }

  // Show iOS-specific install hint
  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (state === 'subscribed') {
    return (
      <div className="bg-sage-50 border border-sage-100 rounded-bubble px-4 py-3 text-sm text-sage-500 flex items-center justify-between gap-3 animate-fade-up">
        <span className="flex items-center gap-2">✨ <span>Push aktiv</span></span>
        <button onClick={sendTest} className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/70 text-sage-500 hover:bg-white">
          Test-Push
        </button>
      </div>
    );
  }

  if (!isStandalone && isIos) {
    return (
      <div className="bg-butter-100 border border-butter-200 rounded-bubble px-4 py-3 text-[13px] text-ink animate-fade-up">
        <div className="font-semibold mb-1">📲 Zum Homebildschirm hinzufügen</div>
        Damit Push-Erinnerungen auf iOS funktionieren: in Safari unten auf „Teilen" tippen und dann „Zum Home-Bildschirm".
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="bg-mauve-50 border border-mauve-100 rounded-bubble px-4 py-3 text-sm text-ink-soft animate-fade-up">
        Push-Benachrichtigungen sind blockiert. In den Einstellungen für diese Website wieder aktivieren.
      </div>
    );
  }

  if (state === 'unsupported') return null;

  return (
    <button
      onClick={subscribe}
      className="w-full bg-gradient-to-r from-peach-200 to-peach-300 text-ink rounded-bubble px-4 py-3 text-sm font-semibold shadow-bubble active:scale-[0.98] transition-transform animate-fade-up"
    >
      {state === 'loading' ? '…' : '🔔 Push-Erinnerungen aktivieren'}
    </button>
  );
}
