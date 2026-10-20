'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cacheDelete } from '@/lib/cache';
import { applicationsKey } from '@/lib/queryKeys';
import { getSupabase } from '@/lib/supabase/client';
import type { Application } from '@/lib/types';
import { isOffline, messageFor, UserFacingError } from '@/lib/userFacingError';

/** Optimistic delete. Resolves to `true` on success; failures are rolled back and toasted. */
export function useRemoveApplication(userId: string) {
  const queryClient = useQueryClient();
  const key = applicationsKey(userId);

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOffline()) throw new UserFacingError('目前離線，無法刪除。');
      const { error } = await getSupabase().from('applications').delete().eq('id', id);
      if (error) throw new UserFacingError('刪除失敗，請稍後再試。');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Application[]>(key);
      queryClient.setQueryData<Application[]>(key, (list) => list?.filter((a) => a.id !== id));
      return { previous };
    },
    onError: (e, _id, ctx) => {
      queryClient.setQueryData(key, ctx?.previous);
      toast(messageFor(e, '刪除失敗，請稍後再試。'));
    },
    onSuccess: (_data, id) => void cacheDelete(id),
  });

  return (id: string) => mutation.mutateAsync(id).then(() => true, () => false);
}
