import { useRef, useState } from 'react';
import { fetchCakeJobPreview, type CakeJobPreview, type CakePreviewFailure } from '@/lib/cake-resume/jobPreview';
import { parseCakeJobUrl } from '@/lib/cake-resume/jobUrl';

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
