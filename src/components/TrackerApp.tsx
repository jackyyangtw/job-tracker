'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';
import Dashboard from './Dashboard';
import LoginScreen from './LoginScreen';

const noopSubscribe = () => () => {};
// Reads ?auth_error from the URL on the client; the server snapshot is `false` so hydration matches.
const readAuthError = () => new URLSearchParams(window.location.search).has('auth_error');

export default function TrackerApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const authError = useSyncExternalStore(noopSubscribe, readAuthError, () => false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    // Only set state in this callback; calling other Supabase methods inside it can deadlock.
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) return <p role="status" className="py-7 text-center text-muted-foreground">載入中…</p>;
  if (!session) return <LoginScreen authError={authError} />;
  return <Dashboard session={session} />;
}
