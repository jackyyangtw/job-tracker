import { createParser, parseAsString, parseAsStringLiteral, throttle, useQueryStates } from 'nuqs';
import { isMonth } from '@/lib/dates';
import { STATUS_LIST, type Status } from '@/lib/types';
import { useTrackerStore, type View } from '@/store/useTrackerStore';

const parseAsMonth = createParser({
  parse: (v) => (isMonth(v) ? v : null),
  serialize: (v: string) => v,
});

/**
 * 投遞頁的篩選條件，只存在網址（nuqs），重新整理或分享連結都會保留。
 * 不合法的值（例如 `?status=hired`、`?month=2026-13x`）會被當成沒設定。
 */
const filterParsers = {
  view: parseAsStringLiteral(['board', 'list'] as const),
  q: parseAsString.withDefault(''),
  source: parseAsString.withDefault(''),
  /** `YYYY-MM`，空字串代表所有月份。 */
  month: parseAsMonth.withDefault(''),
  /** 手機版看板只顯示的狀態；桌機版每個狀態各一欄，不受影響。 */
  status: parseAsStringLiteral<Status | 'all'>(['all', ...STATUS_LIST.map((s) => s.key)]).withDefault('all'),
};

// 打字時不必每個字都寫一次網址（Safari 對 History API 的頻率限制很嚴）；畫面上的值仍是立即更新。
const TYPING = { limitUrlUpdates: throttle(300) };

/**
 * 篩選條件與看板／列表檢視。
 * 檢視方式網址沒指定時，用上次的選擇（存在 Zustand 的偏好設定，localStorage）；切換時兩邊都更新。
 */
export function useApplicationFilters() {
  const [f, setFilters] = useQueryStates(filterParsers);
  const savedView = useTrackerStore((s) => s.view);

  return {
    view: f.view ?? savedView,
    query: f.q,
    source: f.source,
    month: f.month,
    status: f.status,
    setView: (view: View) => {
      useTrackerStore.getState().setView(view);
      void setFilters({ view });
    },
    setQuery: (q: string) => void setFilters({ q }, TYPING),
    setSource: (source: string) => void setFilters({ source }),
    setMonth: (month: string) => void setFilters({ month: isMonth(month) ? month : '' }),
    setStatus: (status: Status | 'all') => void setFilters({ status }),
  };
}
