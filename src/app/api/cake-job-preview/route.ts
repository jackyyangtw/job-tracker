import { NextResponse } from 'next/server';
import { parseCakeJobPage } from '@/lib/cake-resume/jobPreview';
import { cakeJobPageUrl, parseCakeJobUrl } from '@/lib/cake-resume/jobUrl';
import { createClient } from '@/lib/supabase/server';

// 查詢貼上的 Cake 職缺連結的公司與職稱，讓表單自動填入。
// 解析的是 Cake 職缺頁的 HTML，隨時可能改版或擋掉我們，因此所有失敗都只回傳單純的錯誤狀態碼，
// 前端會保留欄位讓使用者自行輸入。
//
// 安全性：只有登入的使用者能呼叫；上游網址由這裡用驗證過的公司與職缺代碼自行組出，
// 轉址也只跟隨到 www.cake.me，因此無法被導向其他主機。

const HEADERS = { 'Cache-Control': 'private, no-store' };
const MAX_BYTES = 3_000_000;
// 104 在 Cloudflare 後面會拒絕與 TLS 特徵不符的瀏覽器 User-Agent；Cake 也在 Cloudflare 後面，同樣用誠實的簡短 UA。
const UA = 'job-tracker-pwa/1.0';

const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: HEADERS });

/** 讀取回應內容，超過上限就停止（有些回應沒有 content-length）。 */
async function readCapped(res: Response): Promise<string | null> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** 抓 Cake 職缺頁；只跟隨一次指向 www.cake.me 的轉址。 */
async function fetchCake(url: string): Promise<Response> {
  const init: RequestInit = {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'zh-TW' },
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  };
  const res = await fetch(url, init);
  if (res.status < 300 || res.status >= 400) return res;
  const location = res.headers.get('location');
  const next = location ? new URL(location, url) : null;
  if (!next || next.protocol !== 'https:' || next.hostname !== 'www.cake.me') return res;
  return fetch(next, init);
}

export async function GET(request: Request) {
  const job = parseCakeJobUrl(new URL(request.url).searchParams.get('url') ?? '');
  if (!job) return fail(400, 'unsupported url');

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail(401, 'unauthorized');

  try {
    const res = await fetchCake(cakeJobPageUrl(job));
    if (!res.ok) {
      console.warn('cake-job-preview: Cake 回應', res.status, job); // 讓 Vercel Logs 看得到是被擋還是壞掉
      return fail(res.status === 404 ? 404 : 502, 'upstream error');
    }
    const html = await readCapped(res);
    if (html === null) return fail(502, 'upstream too large');

    const preview = parseCakeJobPage(html);
    if (!preview) return fail(404, 'not found');
    return NextResponse.json(preview, { headers: HEADERS });
  } catch (error) {
    console.warn('cake-job-preview: 呼叫 Cake 失敗', String(error), job);
    return fail(502, 'upstream unavailable');
  }
}
