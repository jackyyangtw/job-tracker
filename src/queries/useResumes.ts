'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { resumeFromRow } from '@/lib/data/mapping';
import { getSupabase } from '@/lib/supabase/client';
import type { Resume, ResumeRow } from '@/lib/types';
import { resumeLinksKey, resumesKey } from '@/queries/keys';

const EMPTY_RESUMES: Resume[] = [];
const EMPTY_LINKS: ReadonlyMap<string, string> = new Map();
/** 簽章網址的有效時間；提早重新簽，使用者點下去時網址一定還有效。 */
const LINK_TTL_SECONDS = 60 * 60;
const LINK_REFRESH_MS = 45 * 60 * 1000;

/**
 * 目前登入使用者的履歷版本，以及 PDF 的簽章網址（檔案路徑 → 網址）。
 * PDF 放在私有 bucket，只能用有時效的簽章網址開啟；Storage 回應帶 Content-Type: application/pdf
 * 且沒有加 download 參數，瀏覽器會直接預覽而不是下載。
 */
export function useResumes(userId: string) {
  const list = useQuery({
    queryKey: resumesKey(userId),
    queryFn: async () => {
      const { data, error } = await getSupabase().from('resumes').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data as ResumeRow[]).map(resumeFromRow);
    },
    retry: 1,
  });

  const resumes = list.data ?? EMPTY_RESUMES;
  const paths = resumes.flatMap((r) => (r.kind === 'pdf' && r.filePath ? [r.filePath] : [])).sort();

  const links = useQuery({
    queryKey: resumeLinksKey(userId, paths),
    queryFn: async () => {
      const { data, error } = await getSupabase().storage.from('resumes').createSignedUrls(paths, LINK_TTL_SECONDS);
      if (error) throw error;
      return new Map(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : []))) as ReadonlyMap<string, string>;
    },
    enabled: paths.length > 0,
    staleTime: LINK_REFRESH_MS,
    refetchInterval: LINK_REFRESH_MS,
  });

  useResumesRealtime(userId);

  return { resumes, loaded: list.data !== undefined || list.isError, links: links.data ?? EMPTY_LINKS };
}

/** 其他裝置新增、修改或刪除履歷版本時重新抓取（資料量很小，不必逐筆合併）。 */
function useResumesRealtime(userId: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const sb = getSupabase();
    const channel = sb
      .channel(`resumes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resumes' }, () => {
        void queryClient.invalidateQueries({ queryKey: resumesKey(userId) });
      })
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
