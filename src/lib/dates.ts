const pad = (n: number) => String(n).padStart(2, '0');

/** 本地日曆的 `YYYY-MM-DD`。刻意不用 toISOString()，它在 UTC+8 會讓日期差一天。 */
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

/** 從 `earlier` 到 `later` 相隔的整天數（兩者都是 `YYYY-MM-DD`）。 */
export function daysBetween(later: string, earlier: string): number {
  return Math.round((parseD(later).getTime() - parseD(earlier).getTime()) / 86_400_000);
}

export function addDays(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return dstr(d);
}

const MONTH_RE = /^\d{4}-\d{2}$/;

/** 是否為 `YYYY-MM` 格式的月份（用來檢查網址參數）。 */
export const isMonth = (s: string) => MONTH_RE.test(s);

/** `2026-10` -> `2026 年 10 月` */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${y} 年 ${Number(m)} 月`;
}

/** `2026-10-20` -> `10/20` */
export function shortDate(s: string): string {
  return s ? s.slice(5).replace('-', '/') : '';
}
