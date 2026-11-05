'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { resumeToRow, safeUrl } from '@/lib/data/mapping';
import { isOffline, messageFor, UserFacingError } from '@/lib/data/userFacingError';
import { resumeFilePath, type ResumeDraft } from '@/lib/resumes/resume';
import { getSupabase } from '@/lib/supabase/client';
import type { Resume } from '@/lib/types';
import { applicationsKey, mutationKeys, resumeLinksKey, resumesKey } from '@/queries/keys';

interface Input {
  draft: ResumeDraft;
  /** 正在編輯的版本；新增時是 null。 */
  current: Resume | null;
}

/**
 * 新增或修改履歷版本。PDF 要先上傳才有檔案路徑可以寫入，所以不做樂觀更新，
 * 改由表單顯示「儲存中」。成功回傳 `true`；失敗會跳出提示。
 */
export function useSaveResume(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: mutationKeys.saveResume,
    mutationFn: async ({ draft, current }: Input) => {
      if (isOffline()) throw new UserFacingError('目前離線，無法儲存。連上網路後再試一次。');
      const sb = getSupabase();
      const id = current?.id ?? crypto.randomUUID();
      const isPdf = draft.kind === 'pdf';
      let filePath = isPdf ? (current?.filePath ?? '') : '';
      let fileName = isPdf ? (current?.fileName ?? '') : '';

      if (isPdf && draft.file) {
        filePath = resumeFilePath(userId, id);
        // 更換檔案時覆蓋同一個路徑，不會留下舊檔。
        const { error } = await sb.storage
          .from('resumes')
          .upload(filePath, draft.file, { contentType: 'application/pdf', upsert: true, cacheControl: '0' });
        if (error) throw new UserFacingError('PDF 上傳失敗，請稍後再試。');
        fileName = draft.file.name.slice(0, 200);
      }

      const resume: Resume = {
        id,
        name: draft.name.trim(),
        kind: draft.kind,
        url: isPdf ? '' : safeUrl(draft.url),
        filePath,
        fileName,
        createdAt: current?.createdAt ?? '',
        updatedAt: '',
      };
      const { error } = await sb.from('resumes').upsert(resumeToRow(resume));
      if (error) {
        // 新增時資料列沒寫成功，剛上傳的檔案就沒有人用了。
        if (!current && filePath) void sb.storage.from('resumes').remove([filePath]);
        throw new UserFacingError('儲存失敗，請稍後再試。');
      }

      // 從 PDF 改成網址：檔案用不到了。刪不掉只是多佔一點空間，不影響使用。
      if (current?.kind === 'pdf' && !isPdf && current.filePath) {
        void sb.storage.from('resumes').remove([current.filePath]);
      }
      return resume;
    },
    onSuccess: (resume, { draft, current }) => {
      void queryClient.invalidateQueries({ queryKey: resumesKey(userId) });
      // 換了檔案但路徑相同：簽章網址仍有效，但要重新簽，避免拿到瀏覽器快取的舊檔。
      if (draft.file) void queryClient.invalidateQueries({ queryKey: resumeLinksKey(userId, []) });
      // 改名時資料庫的 trigger 會同步投遞上的名稱。
      if (current && current.name !== resume.name) void queryClient.invalidateQueries({ queryKey: applicationsKey(userId) });
    },
    onError: (e) => toast(messageFor(e, '儲存失敗，請稍後再試。')),
  });

  return (draft: ResumeDraft, current: Resume | null) => mutation.mutateAsync({ draft, current }).then(() => true, () => false);
}
