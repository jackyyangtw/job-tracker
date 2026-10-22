'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/hooks/useSession';
import { getSupabase } from '@/lib/supabase/client';

const noopSubscribe = () => () => {};
// 在瀏覽器端讀取網址的 ?auth_error；伺服器端快照固定是 `false`，hydration 才會一致。
const readAuthError = () => new URLSearchParams(window.location.search).has('auth_error');

/** 登入頁。已經登入的使用者會直接被導回看板。 */
export default function LoginScreen() {
  const router = useRouter();
  const { session, checking } = useSession();
  const authError = useSyncExternalStore(noopSubscribe, readAuthError, () => false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (session) router.replace('/applications');
  }, [session, router]);

  async function signIn() {
    setBusy(true);
    setErr('');
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErr('無法開始 Google 登入，請稍後再試。');
      setBusy(false);
    }
    // 成功時瀏覽器會被導向 Google，這裡不需要再做任何事。
  }

  if (checking || session) return <p role="status" className="py-7 text-center text-muted-foreground">載入中…</p>;

  return (
    <main className="grid min-h-[calc(100dvh-80px)] place-items-center">
      <Card className="w-full max-w-100 gap-3.5 rounded-2xl px-6 py-7">
        <h1 className="text-2xl text-balance">投遞追蹤看板</h1>
        <p className="text-muted-foreground">記錄每次投遞、提醒該跟進的職缺，並看出哪個管道和哪份履歷比較有回應。這是我個人使用的工具，目前不開放註冊；想看看它怎麼運作，可以進入試用模式用範例資料操作。</p>
        {(authError || err) && (
          <p role="alert" className="text-[13px] text-destructive">
            {err || '登入沒有完成。目前只開放擁有者登入，可以先使用試用模式。'}
          </p>
        )}
        <Button asChild>
          <Link href="/demo/applications">進入試用模式（不需登入）</Link>
        </Button>
        <Button type="button" variant="outline" onClick={signIn} disabled={busy}>
          {busy ? '前往 Google…' : '擁有者登入（Google）'}
        </Button>
        <p className="text-xs text-muted-foreground">試用模式的資料只存在瀏覽器分頁裡，不會被儲存。</p>
      </Card>
    </main>
  );
}
