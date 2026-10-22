import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Noto_Sans_TC } from 'next/font/google';
import Providers from '@/components/Providers';
import RegisterSW from '@/components/RegisterSW';
import { Toaster } from '@/components/ui/sonner';
import { THEME_COLOR, themeInitScript } from '@/lib/theme';
import { PREFS_KEY } from '@/store/prefsKey';
import './globals.css';

// 在 React 載入前套用外觀，重新整理時才不會先閃一下錯的深淺色。
const THEME_INIT_SCRIPT = themeInitScript(PREFS_KEY);

// Noto Sans TC 是體積很大的中日韓字型；`preload: false` 避免首次載入時預載所有字重。
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
    // 沒有 JS 時的預設；載入後 ThemeSync 會改成使用者選的外觀。
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme 由下面的 script 在 hydration 前設定，伺服器端沒有這個屬性，所以略過這個差異的警告。
    <html lang="zh-Hant-TW" className={`${noto.variable} ${plex.variable}`} suppressHydrationWarning>
      <head>
        {/* 刻意用原生 <script> 而不是 next/script：beforeInteractive 在 App Router 會延到 Next 的程式載入後才執行，
            來不及在第一次繪製前套用。dev 模式會出現「Encountered a script tag」警告，這是預期的：
            它只需要在瀏覽器解析伺服器 HTML 時執行一次。 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
        <RegisterSW />
      </body>
    </html>
  );
}
