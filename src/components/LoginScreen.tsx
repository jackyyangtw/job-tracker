'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getSupabase } from '@/lib/supabase/client';

export default function LoginScreen({ authError }: { authError: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
    // On success the browser is redirected to Google, so there is nothing more to do here.
  }

  return (
    <div className="grid min-h-[calc(100dvh-80px)] place-items-center">
      <Card className="w-full max-w-100 gap-3.5 rounded-2xl px-6 py-7">
        <h1 className="text-2xl text-balance">投遞追蹤看板</h1>
        <p className="text-muted-foreground">記錄每次投遞、提醒你該跟進的職缺，並看出哪個管道和哪份履歷比較有回應。登入後，手機與電腦的資料會自動同步。</p>
        {(authError || err) && <p className="text-[13px] text-destructive">{err || '登入沒有完成，請再試一次。'}</p>}
        <Button type="button" onClick={signIn} disabled={busy}>
          {busy ? '前往 Google…' : '使用 Google 帳號登入'}
        </Button>
        <p className="text-xs text-muted-foreground">你的資料只有你自己能讀寫，其他帳號看不到。</p>
      </Card>
    </div>
  );
}
