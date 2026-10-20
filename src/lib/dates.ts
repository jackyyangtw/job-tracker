const pad = (n: number) => String(n).padStart(2, '0');

/** Local-calendar `YYYY-MM-DD`. Deliberately not toISOString(), which would shift the day in UTC+8. */
export function dstr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return dstr(new Date());
}

export function parseD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `earlier` to `later` (both `YYYY-MM-DD`). */
export function daysBetween(later: string, earlier: string): number {
  return Math.round((parseD(later).getTime() - parseD(earlier).getTime()) / 86_400_000);
}

export function addDays(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return dstr(d);
}

/** `2026-10-20` -> `10/20` */
export function shortDate(s: string): string {
  return s ? s.slice(5).replace('-', '/') : '';
}
