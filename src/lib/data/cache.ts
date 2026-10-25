// 最後一次從 Supabase 抓到的資料在 IndexedDB 的副本，讓 App 離線時仍有東西可以顯示。
// 資料的唯一真實來源仍是 Supabase；這份快取只在啟動時讀取，登出時會清空。
import Dexie, { type Table } from 'dexie';
import { normalizeApp } from './mapping';
import type { Application } from '../types';

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
      // IndexedDB 的內容可能是舊版格式或被竄改過，和匯入檔一樣當成不可信任的資料重新驗證。
      .map(({ userId: _u, ...app }) => normalizeApp(app))
      .filter((a): a is Application => a !== null)
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
    /* 快取是盡力而為 */
  }
}

export async function cachePut(userId: string, apps: Application[]): Promise<void> {
  try {
    await getDb()?.apps.bulkPut(apps.filter((a) => !a.sample).map((a) => ({ ...a, userId })));
  } catch {
    /* 盡力而為 */
  }
}

export async function cacheDelete(id: string): Promise<void> {
  try {
    await getDb()?.apps.delete(id);
  } catch {
    /* 盡力而為 */
  }
}

/** 登出時呼叫，避免共用裝置上的下一個人讀到這位使用者的投遞資料。 */
export async function cacheClear(): Promise<void> {
  try {
    await getDb()?.apps.clear();
  } catch {
    /* 盡力而為 */
  }
}
