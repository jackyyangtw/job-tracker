import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Noto_Sans_TC } from 'next/font/google';
import Providers from '@/components/Providers';
import RegisterSW from '@/components/RegisterSW';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

// Noto Sans TC is a large CJK font; `preload: false` avoids preloading every weight on first paint.
const noto = Noto_Sans_TC({ weight: ['400', '500', '700'], display: 'swap', preload: false, variable: '--font-noto' });
const plex = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', variable: '--font-plex' });

export const metadata: Metadata = {
  title: '投遞追蹤看板',
  description: '記錄每次求職投遞，提醒你該跟進的職缺，並統計各來源與履歷版本的回應率。',
  applicationName: '投遞追蹤',
  appleWebApp: { capable: true, title: '投遞追蹤', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f5f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1413' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" className={`${noto.variable} ${plex.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
        <RegisterSW />
      </body>
    </html>
  );
}
