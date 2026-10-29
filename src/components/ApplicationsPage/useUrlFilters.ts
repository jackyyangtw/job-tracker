import { useEffect } from 'react';
import { isMonth } from '@/lib/dates';
import { isStatus } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';

/**
 * 把檢視、搜尋、來源、月份與手機版的狀態篩選同步到網址，重新整理或分享連結時才會保留。
 *
 * 寫回網址時一律讀 store 的最新值，不用 render 時拿到的值：hydration 的第一次 render 拿到的是 store 的初始值
 * （看板），若用它寫回網址，會把 `?view=list` 蓋成 `?view=board`；開發模式的 StrictMode 會再執行一次
 * 「讀網址」，結果就是重新整理後列表變回看板。
 */
export function useUrlFilters() {
  useEffect(() => {
    // 載入時：網址 -> store。
    const p = new URLSearchParams(window.location.search);
    const v = p.get('view');
    const { setView, setQuery, setSource, setMonth, setStatus } = useTrackerStore.getState();
    if (v === 'board' || v === 'list') setView(v);
    setQuery(p.get('q') ?? '');
    setSource(p.get('source') ?? '');
    const m = p.get('month') ?? '';
    setMonth(isMonth(m) ? m : '');
    const st = p.get('status');
    setStatus(isStatus(st) ? st : 'all');

    // 之後：store -> 網址（用 replaceState，歷史紀錄才不會被每次按鍵塞滿）。不認得的參數（例如預填）保留。
    function syncUrl() {
      const { view, query, source, month, status } = useTrackerStore.getState();
      const next = new URLSearchParams(window.location.search);
      const sync = (key: string, value: string) => (value ? next.set(key, value) : next.delete(key));
      sync('view', view);
      sync('q', query);
      sync('source', source);
      sync('month', month);
      sync('status', status === 'all' ? '' : status);
      const qs = next.toString();
      if (`?${qs}` === window.location.search || (!qs && !window.location.search)) return;
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }
    syncUrl();
    return useTrackerStore.subscribe(syncUrl);
  }, []);
}
