import type { MetadataRoute } from 'next';
import { THEME_COLOR } from '@/lib/ui/theme';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // 固定的 App 識別；之後就算改 start_url，已安裝的 PWA 也不會被當成另一個 App。
    id: '/',
    name: '投遞追蹤看板',
    short_name: '投遞追蹤',
    description: '記錄每次求職投遞，提醒你該跟進的職缺，並統計各來源與履歷版本的回應率。',
    start_url: '/applications',
    scope: '/',
    display: 'standalone',
    lang: 'zh-Hant-TW',
    // 和頁面的 theme-color（淺色）一致，啟動畫面與標題列才不會先閃一下別的顏色。
    background_color: THEME_COLOR.light,
    theme_color: THEME_COLOR.light,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
