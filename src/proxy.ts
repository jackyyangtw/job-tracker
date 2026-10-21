// Next.js 16 把 `middleware.ts` 改名為 `proxy.ts`（匯出的函式叫 `proxy`）。
// 這裡唯一的工作是在每次請求時讓 Supabase 的登入 cookie 保持最新。
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // 向 Supabase Auth 伺服器驗證 session，必要時更新。
  // 不要在 createServerClient 與這個呼叫之間加入任何程式碼。
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 略過靜態資源、Service Worker、manifest 與圖示。
    '/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|icons/).*)',
  ],
};
