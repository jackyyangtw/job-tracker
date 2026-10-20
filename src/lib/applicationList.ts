import type { Application } from './types';

export const EMPTY_APPLICATIONS: Application[] = [];

const byUpdatedDesc = (a: Application, b: Application) => b.updatedAt.localeCompare(a.updatedAt);

/** Inserts or replaces one application and keeps the list sorted by most recently updated. */
export function mergeApplication(list: Application[] | undefined, app: Application): Application[] {
  return [app, ...(list ?? []).filter((x) => x.id !== app.id)].sort(byUpdatedDesc);
}
