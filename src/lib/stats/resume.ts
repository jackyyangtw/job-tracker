/** 履歷版本成效：各版本的面試邀約率、樣本多寡與目前領先的版本。 */
import { REPLIED, type Application } from '../types';
import { reachedInterview } from './application';
import type { Tally } from './tally';

/** 少於這個筆數算「樣本極少」：結果僅供參考，也不會被選為領先版本。 */
export const VERY_FEW_SAMPLE = 5;
/** 少於這個筆數算「樣本偏少」：可以參考，但還需要持續觀察。 */
export const MIN_SAMPLE = 10;

export type SampleLevel = 'very-few' | 'few' | 'enough';

export function sampleLevel(n: number): SampleLevel {
  if (n < VERY_FEW_SAMPLE) return 'very-few';
  if (n < MIN_SAMPLE) return 'few';
  return 'enough';
}

export interface VersionStats extends Tally {
  /** 進過面試的數量（判斷方式見 reachedInterview）。 */
  interviewed: number;
  /** 面試邀約率：進過面試 ÷ 投遞數，四捨五入到整數百分比。 */
  interviewPct: number;
  offer: number;
}

/** 依履歷版本（或其他欄位）統計回應、面試與 Offer；排序與 groupTally 相同。 */
export function compareVersions(list: Application[], keyOf: (a: Application) => string, emptyLabel: string): VersionStats[] {
  const map = new Map<string, { n: number; replied: number; interviewed: number; offer: number }>();
  for (const a of list) {
    if (a.status === 'wishlist') continue;
    const key = keyOf(a) || emptyLabel;
    const cur = map.get(key) ?? { n: 0, replied: 0, interviewed: 0, offer: 0 };
    cur.n += 1;
    if (REPLIED.includes(a.status)) cur.replied += 1;
    if (reachedInterview(a)) cur.interviewed += 1;
    if (a.status === 'offer') cur.offer += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({
      name,
      ...v,
      pct: Math.round((v.replied / v.n) * 100),
      interviewPct: Math.round((v.interviewed / v.n) * 100),
    }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'zh-Hant-TW'));
}

/**
 * 目前面試邀約率最高的版本。只在至少兩個版本可以比較時才選：
 * 「未填版本」（`exclude`）與樣本極少的版本不參加；邀約率相同時取投遞數多的；
 * 沒有任何版本拿到面試時不選。
 */
export function leadingVersion(rows: VersionStats[], exclude: string): VersionStats | null {
  const named = rows.filter((r) => r.name !== exclude);
  if (named.length < 2) return null;
  let best: VersionStats | null = null;
  for (const r of named) {
    if (sampleLevel(r.n) === 'very-few' || !r.interviewed) continue;
    if (!best || r.interviewPct > best.interviewPct || (r.interviewPct === best.interviewPct && r.n > best.n)) best = r;
  }
  return best;
}
