/** 投遞趨勢：依投遞日統計每週／每月的投遞數。 */
import { addDays, dstr, parseD, shortDate } from '../dates';
import type { Application } from '../types';

export type TrendUnit = 'week' | 'month';

export interface TrendBucket {
  /** 週：該週週一的 `YYYY-MM-DD`；月：`YYYY-MM`。 */
  key: string;
  /** 圖表下方的短標籤：週是 `10/20`，月是 `10 月`。 */
  label: string;
  n: number;
}

/** 這一天所在週的週一（`YYYY-MM-DD`）。 */
function weekStart(day: string): string {
  const d = parseD(day);
  // getDay()：週日是 0，換算成「距離週一幾天」。
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dstr(d);
}

/**
 * 最近 `count` 週／月（含本週／本月）每段的投遞數，依投遞日分組，沒有投遞的區間也會列出（n 為 0）。
 * 「想投」不算；`undated` 是已投遞但沒填投遞日、因此沒算進圖表的筆數。
 */
export function trend(list: Application[], unit: TrendUnit, today: string, count: number): { buckets: TrendBucket[]; undated: number } {
  const keys: string[] = [];
  if (unit === 'week') {
    const start = parseD(weekStart(today));
    for (let i = count - 1; i >= 0; i--) keys.push(addDays(-7 * i, start));
  } else {
    const t = parseD(today);
    for (let i = count - 1; i >= 0; i--) keys.push(dstr(new Date(t.getFullYear(), t.getMonth() - i, 1)).slice(0, 7));
  }

  const counts = new Map(keys.map((k) => [k, 0]));
  let undated = 0;
  for (const a of list) {
    if (a.status === 'wishlist') continue;
    if (!a.appliedAt) {
      undated += 1;
      continue;
    }
    const key = unit === 'week' ? weekStart(a.appliedAt) : a.appliedAt.slice(0, 7);
    const cur = counts.get(key);
    if (cur !== undefined) counts.set(key, cur + 1);
  }

  return {
    buckets: keys.map((key) => ({ key, label: unit === 'week' ? shortDate(key) : `${Number(key.slice(5))} 月`, n: counts.get(key) ?? 0 })),
    undated,
  };
}
