import { useRef, useState } from 'react';
import { fetchJobPreview, parse104JobId, type JobPreview, type PreviewFailure } from '@/lib/jobPreview';

export type PreviewStatus = 'idle' | 'loading' | 'done' | PreviewFailure;

/** 在貼上或離開欄位時才查詢 104 連結，不是每打一個字就查。 */
export function useJobPreview(onResult: (preview: JobPreview) => void) {
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const lastId = useRef<string | null>(null);

  function request(url: string) {
    const id = parse104JobId(url);
    if (!id || id === lastId.current) return;
    lastId.current = id;
    setStatus('loading');
    void fetchJobPreview(url).then((result) => {
      if (lastId.current !== id) return; // 已被較新的連結取代
      if ('preview' in result) {
        onResult(result.preview);
        setStatus('done');
      } else {
        lastId.current = null; // 讓下一次離開欄位或貼上時可以再試一次
        setStatus(result.failure);
      }
    });
  }

  return { status, request };
}
