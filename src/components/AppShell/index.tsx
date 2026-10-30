'use client';

import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { flagsOf } from '@/lib/applications/flags';
import { sampleApps } from '@/lib/applications/sample';
import { signOutAndClear } from '@/lib/supabase/signOut';
import { useApplications } from '@/queries/useApplications';
import { useApplicationsRealtime } from '@/queries/useApplicationsRealtime';
import { useImportApplications } from '@/queries/useImportApplications';
import { useRemoveApplication } from '@/queries/useRemoveApplication';
import { useStaleDaysSync } from '@/queries/useStaleDaysSync';
import { useUpsertApplication } from '@/queries/useUpsertApplication';
import { useTrackerStore } from '@/store/useTrackerStore';
import type { Shell } from './ShellContext';
import ShellFrame from './ShellFrame';
import ShellSkeleton from './ShellSkeleton';
import { useAppBadge } from './useAppBadge';

export { useShell } from './ShellContext';
export { default as DemoShell } from './DemoShell';

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

  if (!session) return <ShellSkeleton />;
  return <SignedInShell session={session}>{children}</SignedInShell>;
}

function SignedInShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const userId = session.user.id;
  const queryClient = useQueryClient();
  const { apps, loaded, offline } = useApplications(userId);
  useApplicationsRealtime(userId);
  const changeStaleDays = useStaleDaysSync(userId);
  const upsert = useUpsertApplication(userId);
  const remove = useRemoveApplication(userId);
  const importMany = useImportApplications(userId);
  const staleDays = useTrackerStore((s) => s.staleDays);
  const samplesDismissed = useTrackerStore((s) => s.samplesDismissed);

  const samplesOn = loaded && apps.length === 0 && !samplesDismissed;
  const shown = samplesOn ? sampleApps() : apps;

  const pending = shown.filter((a) => flagsOf(a, staleDays).length > 0).length;
  useAppBadge(pending, loaded);

  function signOut() {
    void signOutAndClear(queryClient);
  }

  const shell: Shell = {
    isDemo: false,
    basePath: '',
    email: session.user.email ?? null,
    apps,
    shown,
    samplesOn,
    loaded,
    offline,
    changeStaleDays,
    upsert,
    remove,
    importMany,
    signOut,
  };

  return <ShellFrame shell={shell}>{children}</ShellFrame>;
}
