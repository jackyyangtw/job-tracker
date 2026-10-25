'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toRow } from '@/lib/data/mapping';
import { applicationsKey, mutationKeys } from '@/queries/keys';
import { getSupabase } from '@/lib/supabase/client';
import type { Application } from '@/lib/types';
import { isOffline, messageFor, UserFacingError } from '@/lib/data/userFacingError';

const CHUNK_SIZE = 100;

/** 分批大量 upsert。回傳實際儲存的筆數，完成後重新抓取列表。 */
export function useImportApplications(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: mutationKeys.importApplications,
    mutationFn: async (apps: Application[]) => {
      if (isOffline()) throw new UserFacingError('目前離線，無法匯入。');
      const sb = getSupabase();
      let done = 0;
      try {
        for (let i = 0; i < apps.length; i += CHUNK_SIZE) {
          const chunk = apps.slice(i, i + CHUNK_SIZE);
          const { error } = await sb.from('applications').upsert(chunk.map(toRow));
          if (error) throw error;
          done += chunk.length;
        }
      } catch {
        toast('匯入中斷，部分資料可能尚未儲存。');
      }
      return done;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: applicationsKey(userId) }),
    onError: (e) => toast(messageFor(e, '匯入失敗，請稍後再試。')),
  });

  return (apps: Application[]) => mutation.mutateAsync(apps).catch(() => 0);
}
