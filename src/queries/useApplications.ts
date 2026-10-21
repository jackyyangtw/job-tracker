'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EMPTY_APPLICATIONS } from '@/lib/applicationList';
import { cacheReplace, cacheRead } from '@/lib/cache';
import { fromRow } from '@/lib/mapping';
import { applicationsCacheKey, applicationsKey } from '@/queries/keys';
import { getSupabase } from '@/lib/supabase/client';
import type { ApplicationRow } from '@/lib/types';

/** 目前登入使用者的投遞資料：先顯示 IndexedDB 的副本，Supabase 回應後再取代。 */
export function useApplications(userId: string) {
  const cached = useQuery({
    queryKey: applicationsCacheKey(userId),
    queryFn: () => cacheRead(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const remote = useQuery({
    queryKey: applicationsKey(userId),
    queryFn: async () => {
      const { data, error } = await getSupabase().from('applications').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      const apps = (data as ApplicationRow[]).map(fromRow);
      await cacheReplace(userId, apps);
      return apps;
    },
    retry: 1,
    // 視窗取得焦點或重新連線時會自動重新抓取（預設行為）。
  });

  const apps = remote.data ?? cached.data ?? EMPTY_APPLICATIONS;
  const loaded = remote.data !== undefined || (remote.isError && cached.isSuccess);
  const offline = remote.isError;

  useEffect(() => {
    if (remote.isError && !remote.data && cached.isSuccess && cached.data.length === 0) {
      toast('無法連線到伺服器，請稍後再試。');
    }
  }, [remote.isError, remote.data, cached.isSuccess, cached.data]);

  return { apps, loaded, offline };
}
