import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '投遞追蹤看板',
    short_name: '投遞追蹤',
    description: '記錄每次求職投遞，提醒你該跟進的職缺，並統計各來源與履歷版本的回應率。',
    start_url: '/applications',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'zh-Hant-TW',
    background_color: '#f2f5f4',
    theme_color: '#0e6b62',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
