'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return; // 開發時避免被舊快取干擾
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 離線支援是加分項目；沒有它 App 仍能運作 */
    });
  }, []);
  return null;
}
