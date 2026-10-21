'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';

/** Current Supabase session in the browser. `checking` stays true until the first answer arrives. */
export function useSession() {
  const [state, setState] = useState<{ session: Session | null; checking: boolean }>({ session: null, checking: true });

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setState({ session: data.session, checking: false }));
    // Only set state in this callback; calling other Supabase methods inside it can deadlock.
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => setState({ session: next, checking: false }));
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
