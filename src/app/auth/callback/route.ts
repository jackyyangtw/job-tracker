import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google 會先導回 Supabase，Supabase 再帶著 ?code=... 導到這裡。
// 我們用這個 code 換成 session cookie，然後把使用者導回 App。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/applications`);
    }
  }
  return NextResponse.redirect(`${origin}/login?auth_error=1`);
}
