import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import SWRegister from '@/components/SWRegister';

export const metadata: Metadata = {
  title: 'Vitaryo',
  description: 'Deine täglichen Vitamine – sanft erinnert.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vitaryo',
  },
};

export const viewport: Viewport = {
  themeColor: '#F4AE87',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="min-h-dvh max-w-[480px] mx-auto safe-top pb-24">
          {children}
        </div>
        <BottomNav />
        <SWRegister />
      </body>
    </html>
  );
}
