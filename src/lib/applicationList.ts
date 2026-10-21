import { dstr } from './dates';
import type { Application } from './types';

export const EMPTY_APPLICATIONS: Application[] = [];

const byUpdatedDesc = (a: Application, b: Application) => b.updatedAt.localeCompare(a.updatedAt);

/** 新增或取代一筆投遞，並讓列表依最近更新排序。 */
export function mergeApplication(list: Application[] | undefined, app: Application): Application[] {
  return [app, ...(list ?? []).filter((x) => x.id !== app.id)].sort(byUpdatedDesc);
}

/**
 * 一筆投遞歸在哪個月份（`YYYY-MM`）：依投遞日；沒有投遞日（例如「想投」）就改用建立日。
 * 建立日是 ISO 時間戳，要先換成本地日期，台灣時間月初的資料才不會被算到上個月。
 */
export function monthOf(a: Application): string {
  const day = a.appliedAt || (a.createdAt ? dstr(new Date(a.createdAt)) : '');
  return day.slice(0, 7);
}

/** 資料裡出現過的所有月份，新的在前。 */
export function monthsOf(apps: Application[]): string[] {
  return [...new Set(apps.map(monthOf).filter(Boolean))].sort().reverse();
}
