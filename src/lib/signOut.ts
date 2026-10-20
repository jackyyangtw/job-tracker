import { cacheClear } from './cache';
import { getSupabase } from './supabase/client';

/** Signs out, wipes the IndexedDB copy and the in-memory query cache so the next person on a shared device sees nothing. */
export async function signOutAndClear(queryClient: { clear: () => void }) {
  await getSupabase().auth.signOut();
  await cacheClear();
  queryClient.clear();
}
