'use client';

import { useEffect } from 'react';
import { applyTheme, DARK_QUERY, resolveTheme } from '@/lib/ui/theme';
import { useTrackerStore } from '@/store/useTrackerStore';

/**
 * 把設定頁選的外觀同步到 <html>。第一次繪製前的套用由 layout 的防閃爍 script 負責，
 * 這裡處理之後的切換；選「跟隨系統」時也會監聽系統的深淺色變化（例如手機日夜自動切換）。
 */
export default function ThemeSync() {
  const theme = useTrackerStore((s) => s.theme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const sync = () => applyTheme(resolveTheme(theme, media.matches));
    sync();
    if (theme !== 'system') return;
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [theme]);

  return null;
}
