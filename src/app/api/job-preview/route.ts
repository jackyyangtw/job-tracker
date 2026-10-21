import { NextResponse } from 'next/server';
import { parse104Job, parse104JobId } from '@/lib/jobPreview';
import { createClient } from '@/lib/supabase/server';

// 查詢貼上的 104 職缺連結的公司與職稱，讓表單自動填入。
// 使用 104 的非官方 JSON 介面，隨時可能改版或擋掉我們，因此所有失敗都只回傳單純的錯誤狀態碼，
// 前端會保留欄位讓使用者自行輸入。
//
// 安全性：只有登入的使用者能呼叫，且上游網址由這裡用驗證過的職缺代碼自行組出，
// 不使用使用者提供的網址，因此無法被導向其他主機。

const HEADERS = { 'Cache-Control': 'private, no-store' };
const MAX_BYTES = 1_000_000;
// 104 在 Cloudflare 後面，會拒絕與用戶端 TLS 特徵不相符的瀏覽器 User-Agent
// （Node 送出 Chrome 的 UA 會得到 403）。誠實的簡短 UA 加上 Referer 則會被接受。
const UA = 'job-tracker-pwa/1.0';

const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: HEADERS });

export async function GET(request: Request) {
  const id = parse104JobId(new URL(request.url).searchParams.get('url') ?? '');
  if (!id) return fail(400, 'unsupported url');

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail(401, 'unauthorized');

  try {
    const res = await fetch(`https://www.104.com.tw/job/ajax/content/${id}`, {
      headers: { Referer: `https://www.104.com.tw/job/${id}`, 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn('job-preview: 104 回應', res.status, 'id =', id); // 讓 Vercel Logs 看得到是被擋還是壞掉
      return fail(502, 'upstream error');
    }
    if (Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) return fail(502, 'upstream too large');

    const preview = parse104Job(await res.json());
    if (!preview) return fail(404, 'not found');
    return NextResponse.json(preview, { headers: HEADERS });
  } catch (error) {
    console.warn('job-preview: 呼叫 104 失敗', String(error), 'id =', id);
    return fail(502, 'upstream unavailable');
  }
}
