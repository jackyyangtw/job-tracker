'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import Dashboard from './Dashboard';

/** 首頁的守門員：已登入顯示看板，其他人導向 /login。 */
export default function TrackerApp() {
  const router = useRouter();
  const { session, checking } = useSession();

  useEffect(() => {
    if (!checking && !session) router.replace('/login');
  }, [checking, session, router]);

  if (!session) return <p role="status" className="py-7 text-center text-muted-foreground">載入中…</p>;
  return <Dashboard session={session} />;
}
