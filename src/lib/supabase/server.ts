import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** 給 route handler 用的伺服器端 client。使用 anon key 與呼叫者的 cookie，所以 RLS 仍然生效。 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 從 Server Component 呼叫時可以忽略，因為 proxy 會負責更新 session。
          }
        },
      },
    },
  );
}
