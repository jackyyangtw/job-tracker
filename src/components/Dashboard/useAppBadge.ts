import { useEffect } from 'react';

type BadgeNav = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

/** PWA app-icon badge = number of applications that need attention. Unsupported browsers ignore it. */
export function useAppBadge(pending: number, loaded: boolean) {
  useEffect(() => {
    const nav = navigator as BadgeNav;
    if (!loaded) return;
    if (pending > 0) void nav.setAppBadge?.(pending).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  }, [pending, loaded]);
}
