'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';

/** 瀏覽器端目前的 Supabase session。第一次回應之前 `checking` 都是 true。 */
export function useSession() {
  const [state, setState] = useState<{ session: Session | null; checking: boolean }>({ session: null, checking: true });

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setState({ session: data.session, checking: false }));
    // 這個 callback 裡只能設定 state；在裡面呼叫其他 Supabase 方法可能造成死結。
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => setState({ session: next, checking: false }));
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
