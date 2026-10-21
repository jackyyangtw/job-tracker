'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userSettingsKey } from '@/lib/queryKeys';
import { getSupabase } from '@/lib/supabase/client';
import { useTrackerStore } from '@/store/useTrackerStore';

/**
 * 讓「超過 N 天沒消息就提醒」在所有裝置上一致。
 * 畫面一律讀 Zustand 的 staleDays（離線也能用）；這裡負責和資料庫的 user_settings 同步：
 *  - 載入或回到前景時讀取資料庫的值，寫進 store。
 *  - 資料庫還沒有設定時，把這台裝置目前的值存上去，舊裝置的設定不會被預設值蓋掉。
 *  - 使用者修改時先更新畫面，再寫入資料庫。
 */
export function useStaleDaysSync(userId: string) {
  const queryClient = useQueryClient();
  const key = userSettingsKey(userId);

  useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const sb = getSupabase();
      const { data, error } = await sb.from('user_settings').select('stale_days').abortSignal(signal).maybeSingle();
      if (error) throw error;
      // 讀取途中使用者改了設定（見 onMutate），就不要用讀回來的舊值蓋掉。
      if (signal.aborted) return null;

      const { staleDays, setStaleDays } = useTrackerStore.getState();
      if (data) {
        setStaleDays(data.stale_days);
        return data.stale_days as number;
      }
      const { error: insertError } = await sb.from('user_settings').upsert({ stale_days: staleDays });
      if (insertError) throw insertError;
      return staleDays;
    },
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: async (staleDays: number) => {
      const { error } = await getSupabase().from('user_settings').upsert({ stale_days: staleDays });
      if (error) throw error;
    },
    onMutate: () => queryClient.cancelQueries({ queryKey: key }),
    onError: () => toast('設定只套用在這台裝置，稍後連線時再改一次即可同步。'),
    // 寫入結束後重新讀一次，確保畫面和資料庫一致。
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return (staleDays: number) => {
    useTrackerStore.getState().setStaleDays(staleDays);
    mutation.mutate(staleDays);
  };
}
