import { REPLIED, type Application } from './types';

export interface Tally {
  name: string;
  /** Applications actually sent (wishlist excluded). */
  n: number;
  /** Applications that got a reply. */
  replied: number;
  /** Reply rate, rounded to a whole percent. */
  pct: number;
}

export function overall(list: Application[]): { n: number; replied: number; pct: number | null } {
  const sent = list.filter((a) => a.status !== 'wishlist');
  const replied = sent.filter((a) => REPLIED.includes(a.status)).length;
  return { n: sent.length, replied, pct: sent.length ? Math.round((replied / sent.length) * 100) : null };
}

export function groupTally(list: Application[], keyOf: (a: Application) => string, emptyLabel: string): Tally[] {
  const map = new Map<string, { n: number; replied: number }>();
  for (const a of list) {
    if (a.status === 'wishlist') continue;
    const key = keyOf(a) || emptyLabel;
    const cur = map.get(key) ?? { n: 0, replied: 0 };
    cur.n += 1;
    if (REPLIED.includes(a.status)) cur.replied += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, n: v.n, replied: v.replied, pct: Math.round((v.replied / v.n) * 100) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}
