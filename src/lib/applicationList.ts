import type { Application } from './types';

export const EMPTY_APPLICATIONS: Application[] = [];

const byUpdatedDesc = (a: Application, b: Application) => b.updatedAt.localeCompare(a.updatedAt);

/** 新增或取代一筆投遞，並讓列表依最近更新排序。 */
export function mergeApplication(list: Application[] | undefined, app: Application): Application[] {
  return [app, ...(list ?? []).filter((x) => x.id !== app.id)].sort(byUpdatedDesc);
}
