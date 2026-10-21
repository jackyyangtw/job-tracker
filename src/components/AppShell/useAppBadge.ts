import { useEffect } from 'react';

type BadgeNav = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

/** PWA 圖示角標 = 需要處理的投遞數量。不支援的瀏覽器會直接忽略。 */
export function useAppBadge(pending: number, loaded: boolean) {
  useEffect(() => {
    const nav = navigator as BadgeNav;
    if (!loaded) return;
    if (pending > 0) void nav.setAppBadge?.(pending).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  }, [pending, loaded]);
}
