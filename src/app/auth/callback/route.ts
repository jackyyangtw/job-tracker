import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google redirects back to Supabase, which redirects here with ?code=...
// We exchange the code for a session cookie, then send the user to the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }
  return NextResponse.redirect(`${origin}/login?auth_error=1`);
}
