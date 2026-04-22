'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Heute', icon: '🌿' },
  { href: '/history', label: 'Verlauf', icon: '📖' },
  { href: '/achievements', label: 'Trophäen', icon: '🏆' },
  { href: '/settings', label: 'Vitamine', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-peach-100 shadow-bubble rounded-[28px] px-2 py-2 grid grid-cols-4">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-2xl transition-colors ${active ? 'bg-peach-50 text-peach-500' : 'text-ink-soft'}`}
              >
                <span className="text-lg leading-none">{it.icon}</span>
                <span className="text-[10px] font-medium tracking-wide">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
