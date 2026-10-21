'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mergeApplication } from '@/lib/applicationList';
import { cachePut } from '@/lib/cache';
import { toRow } from '@/lib/mapping';
import { applicationsKey } from '@/lib/queryKeys';
import { getSupabase } from '@/lib/supabase/client';
import type { Application } from '@/lib/types';
import { isOffline, messageFor, UserFacingError } from '@/lib/userFacingError';

/** 樂觀更新的新增／修改。成功回傳 `true`；失敗會還原並跳出提示。 */
export function useUpsertApplication(userId: string) {
  const queryClient = useQueryClient();
  const key = applicationsKey(userId);

  const mutation = useMutation({
    mutationFn: async (app: Application) => {
      if (isOffline()) throw new UserFacingError('目前離線，無法儲存。連上網路後再試一次。');
      const { error } = await getSupabase().from('applications').upsert(toRow(app));
      if (error) throw new UserFacingError('儲存失敗，請稍後再試。');
    },
    onMutate: async (app) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Application[]>(key);
      queryClient.setQueryData<Application[]>(key, (list) => mergeApplication(list, { ...app, updatedAt: new Date().toISOString() }));
      return { previous };
    },
    onError: (e, _app, ctx) => {
      queryClient.setQueryData(key, ctx?.previous);
      toast(messageFor(e, '儲存失敗，請稍後再試。'));
    },
    onSuccess: (_data, app) => void cachePut(userId, [app]),
  });

  return (app: Application) => mutation.mutateAsync(app).then(() => true, () => false);
}
