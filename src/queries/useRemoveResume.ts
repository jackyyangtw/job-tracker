'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isOffline, messageFor, UserFacingError } from '@/lib/data/userFacingError';
import { detachResumeFromApps } from '@/lib/resumes/resume';
import { getSupabase } from '@/lib/supabase/client';
import type { Application, Resume } from '@/lib/types';
import { applicationsKey, mutationKeys, resumesKey } from '@/queries/keys';

/**
 * 樂觀更新的刪除。投遞上的 resume_id 由資料庫清空（on delete set null），名稱保留。
 * 成功回傳 `true`；失敗會還原並跳出提示。
 */
export function useRemoveResume(userId: string) {
  const queryClient = useQueryClient();
  const key = resumesKey(userId);
  const appsKey = applicationsKey(userId);

  const mutation = useMutation({
    mutationKey: mutationKeys.removeResume,
    mutationFn: async (resume: Resume) => {
      if (isOffline()) throw new UserFacingError('目前離線，無法刪除。');
      const sb = getSupabase();
      const { error } = await sb.from('resumes').delete().eq('id', resume.id);
      if (error) throw new UserFacingError('刪除失敗，請稍後再試。');
      // 資料列刪掉後檔案就沒有用了；刪不掉只是多佔空間，不必讓使用者重試。
      if (resume.filePath) void sb.storage.from('resumes').remove([resume.filePath]);
    },
    onMutate: async (resume) => {
      await Promise.all([queryClient.cancelQueries({ queryKey: key }), queryClient.cancelQueries({ queryKey: appsKey })]);
      const previous = queryClient.getQueryData<Resume[]>(key);
      const previousApps = queryClient.getQueryData<Application[]>(appsKey);
      queryClient.setQueryData<Resume[]>(key, (list) => list?.filter((r) => r.id !== resume.id));
      queryClient.setQueryData<Application[]>(appsKey, (list) => (list ? detachResumeFromApps(list, resume.id) : list));
      return { previous, previousApps };
    },
    onError: (e, _resume, ctx) => {
      queryClient.setQueryData(key, ctx?.previous);
      queryClient.setQueryData(appsKey, ctx?.previousApps);
      toast(messageFor(e, '刪除失敗，請稍後再試。'));
    },
  });

  return (resume: Resume) => mutation.mutateAsync(resume).then(() => true, () => false);
}
