import { useRef, useState } from 'react';
import type { CakeJobPreview } from '@/lib/cake-resume/jobPreview';
import { parseCakeJobUrl } from '@/lib/cake-resume/jobUrl';

type CakePreviewFailure = 'unauthorized' | 'blocked' | 'failed';

const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

/** 請自己的 API 查詢 Cake 職缺。失敗時回傳原因：登入過期、Cake 拒絕（或無法連線），或其他。 */
async function fetchCakeJobPreview(url: string): Promise<{ preview: CakeJobPreview } | { failure: CakePreviewFailure }> {
  try {
    const res = await fetch(`/api/cake-job-preview?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10_000) });
    if (res.status === 401) return { failure: 'unauthorized' };
    if (res.status === 502) return { failure: 'blocked' };
    if (!res.ok) return { failure: 'failed' };
    const data = (await res.json()) as Partial<CakeJobPreview> | null;
    const company = clean(data?.company, 120);
    if (!company) return { failure: 'failed' };
    return { preview: { company, title: clean(data?.title, 160) } };
  } catch {
    return { failure: 'failed' };
  }
}

/** `signedOut`：試用模式沒有登入，不呼叫 API（API 只給登入的使用者用）。 */
export type CakePreviewStatus = 'idle' | 'loading' | 'done' | 'signedOut' | CakePreviewFailure;

/** 在貼上或離開欄位時才查詢 Cake 連結，不是每打一個字就查。`enabled` 為 false 時（試用模式）只顯示說明。 */
export function useCakeJobPreview(onResult: (preview: CakeJobPreview) => void, enabled: boolean) {
  const [status, setStatus] = useState<CakePreviewStatus>('idle');
  const lastUrl = useRef<string | null>(null);

  function request(url: string) {
    if (!parseCakeJobUrl(url) || url === lastUrl.current) return;
    if (!enabled) {
      setStatus('signedOut');
      return;
    }
    lastUrl.current = url;
    setStatus('loading');
    void fetchCakeJobPreview(url).then((result) => {
      if (lastUrl.current !== url) return; // 已被較新的連結取代
      if ('preview' in result) {
        onResult(result.preview);
        setStatus('done');
      } else {
        lastUrl.current = null; // 讓下一次離開欄位或貼上時可以再試一次
        setStatus(result.failure);
      }
    });
  }

  return { status, request };
}
