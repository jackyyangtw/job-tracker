// IndexedDB copy of the last data fetched from Supabase, so the app can show something when offline.
// Supabase stays the source of truth; this cache is only read at startup and is wiped on sign-out.
import Dexie, { type Table } from 'dexie';
import type { Application } from './types';

type CachedApp = Application & { userId: string };

class CacheDB extends Dexie {
  apps!: Table<CachedApp, string>;
  constructor() {
    super('jobtracker-cache');
    this.version(1).stores({ apps: 'id, userId' });
  }
}

let db: CacheDB | null = null;
function getDb(): CacheDB | null {
  if (typeof indexedDB === 'undefined') return null;
  return (db ??= new CacheDB());
}

export async function cacheRead(userId: string): Promise<Application[]> {
  try {
    const d = getDb();
    if (!d) return [];
    const rows = await d.apps.where('userId').equals(userId).toArray();
    return rows
      .map(({ userId: _u, ...app }) => app as Application)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function cacheReplace(userId: string, apps: Application[]): Promise<void> {
  try {
    const d = getDb();
    if (!d) return;
    await d.transaction('rw', d.apps, async () => {
      await d.apps.where('userId').equals(userId).delete();
      await d.apps.bulkPut(apps.filter((a) => !a.sample).map((a) => ({ ...a, userId })));
    });
  } catch {
    /* cache is best-effort */
  }
}

export async function cachePut(userId: string, apps: Application[]): Promise<void> {
  try {
    await getDb()?.apps.bulkPut(apps.filter((a) => !a.sample).map((a) => ({ ...a, userId })));
  } catch {
    /* best-effort */
  }
}

export async function cacheDelete(id: string): Promise<void> {
  try {
    await getDb()?.apps.delete(id);
  } catch {
    /* best-effort */
  }
}

/** Called on sign-out so the next person on a shared device cannot read this user's applications. */
export async function cacheClear(): Promise<void> {
  try {
    await getDb()?.apps.clear();
  } catch {
    /* best-effort */
  }
}
