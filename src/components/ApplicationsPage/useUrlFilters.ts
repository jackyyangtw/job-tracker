import { useEffect } from 'react';
import { isMonth } from '@/lib/dates';
import { isStatus } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';

/** 把檢視、搜尋、來源、月份與手機版的狀態篩選同步到網址，重新整理或分享連結時才會保留。 */
export function useUrlFilters() {
  const view = useTrackerStore((s) => s.view);
  const query = useTrackerStore((s) => s.query);
  const source = useTrackerStore((s) => s.source);
  const month = useTrackerStore((s) => s.month);
  const status = useTrackerStore((s) => s.status);

  // 載入時：網址 -> store。
  useEffect(() => {
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
  }, []);

  // 之後：store -> 網址（用 replaceState，歷史紀錄才不會被每次按鍵塞滿）。
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sync = (key: string, value: string) => (value ? p.set(key, value) : p.delete(key));
    sync('view', view);
    sync('q', query);
    sync('source', source);
    sync('month', month);
    sync('status', status === 'all' ? '' : status);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [view, query, source, month, status]);
}
