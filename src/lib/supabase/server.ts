import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Server-side client for route handlers. Uses the anon key and the caller's cookies, so RLS still applies. */
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
            // Called from a Server Component: safe to ignore because the proxy refreshes sessions.
          }
        },
      },
    },
  );
}
