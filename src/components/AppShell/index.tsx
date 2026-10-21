'use client';

import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { flagsOf } from '@/lib/flags';
import { sampleApps } from '@/lib/sample';
import { useApplications } from '@/queries/useApplications';
import { useApplicationsRealtime } from '@/queries/useApplicationsRealtime';
import { useStaleDaysSync } from '@/queries/useStaleDaysSync';
import { useTrackerStore } from '@/store/useTrackerStore';
import { MobileTabBar, TopBar } from './Nav';
import { ShellContext, type Shell } from './ShellContext';
import { useAppBadge } from './useAppBadge';

export { useShell } from './ShellContext';

/**
 * 登入後三個頁面（投遞、統計、設定）共用的外殼：登入檢查、資料、Realtime、提醒天數同步、
 * 圖示角標與導覽列。放在 layout 裡，切換頁面時不會重新掛載，訂閱也只建立一次。
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, checking } = useSession();

  useEffect(() => {
    if (!checking && !session) router.replace('/login');
  }, [checking, session, router]);

  if (!session) {
    return (
      <p role="status" className="py-7 text-center text-muted-foreground">
        載入中…
      </p>
    );
  }
  return <SignedInShell session={session}>{children}</SignedInShell>;
}

function SignedInShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const userId = session.user.id;
  const { apps, loaded, offline } = useApplications(userId);
  useApplicationsRealtime(userId);
  const changeStaleDays = useStaleDaysSync(userId);
  const staleDays = useTrackerStore((s) => s.staleDays);
  const samplesDismissed = useTrackerStore((s) => s.samplesDismissed);

  const samplesOn = loaded && apps.length === 0 && !samplesDismissed;
  const shown = samplesOn ? sampleApps() : apps;

  const pending = shown.filter((a) => flagsOf(a, staleDays).length > 0).length;
  useAppBadge(pending, loaded);

  const shell: Shell = { session, userId, apps, shown, samplesOn, loaded, offline, changeStaleDays };

  return (
    <ShellContext value={shell}>
      {/* 手機版底部有固定的分頁列，內容要多留底部空間 */}
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[18px] max-md:pb-20">
        <TopBar />
        {children}
      </div>
      <MobileTabBar />
    </ShellContext>
  );
}
