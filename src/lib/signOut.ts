import { cacheClear } from './cache';
import { getSupabase } from './supabase/client';

/** 登出，並清空 IndexedDB 副本與記憶體中的 query 快取，讓共用裝置上的下一個人什麼都看不到。 */
export async function signOutAndClear(queryClient: { clear: () => void }) {
  await getSupabase().auth.signOut();
  await cacheClear();
  queryClient.clear();
}
