'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      // 開發時避免被舊快取干擾：同一個 port 跑過 production 時註冊的 Service Worker 會一直留著，
      // 並用快取回應 /_next/static，一般重新整理就會看到舊畫面。這裡主動解除並清掉它的快取。
      void navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister())));
      void caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('jt-')).map((k) => caches.delete(k))));
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 離線支援是加分項目；沒有它 App 仍能運作 */
    });
  }, []);
  return null;
}
