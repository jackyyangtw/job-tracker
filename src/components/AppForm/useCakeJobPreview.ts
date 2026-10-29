import { useRef, useState } from 'react';
import { fetchCakeJobPreview, parseCakeJobUrl, type CakeJobPreview, type CakePreviewFailure } from '@/lib/cake-resume/jobPreview';

export type CakePreviewStatus = 'idle' | 'loading' | 'done' | CakePreviewFailure;

/** 在貼上或離開欄位時才查詢 Cake 連結，不是每打一個字就查。 */
export function useCakeJobPreview(onResult: (preview: CakeJobPreview) => void) {
  const [status, setStatus] = useState<CakePreviewStatus>('idle');
  const lastUrl = useRef<string | null>(null);

  function request(url: string) {
    if (!parseCakeJobUrl(url) || url === lastUrl.current) return;
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
