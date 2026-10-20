'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mergeApplication } from '@/lib/applicationList';
import { cacheDelete, cachePut } from '@/lib/cache';
import { fromRow } from '@/lib/mapping';
import { applicationsKey } from '@/lib/queryKeys';
import { getSupabase } from '@/lib/supabase/client';
import type { Application, ApplicationRow } from '@/lib/types';

/** Pushes changes made on other devices into the query cache. */
export function useApplicationsRealtime(userId: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const sb = getSupabase();
    const key = applicationsKey(userId);
    const channel = sb
      .channel(`applications-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          queryClient.setQueryData<Application[]>(key, (list) => list?.filter((a) => a.id !== id));
          void cacheDelete(id);
        } else {
          const app = fromRow(payload.new as ApplicationRow);
          queryClient.setQueryData<Application[]>(key, (list) => mergeApplication(list, app));
          void cachePut(userId, [app]);
        }
      })
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
