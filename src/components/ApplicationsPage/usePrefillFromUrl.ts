import { useEffect } from 'react';
import { parsePrefill, PREFILL_KEYS, type Prefill } from '@/lib/data/prefill';

/**
 * 網址帶有 `?new=1&company=…&title=…&url=…` 時（iOS 捷徑、書籤小工具等），開啟新增表單並預填。
 * 讀完就從網址拿掉這些參數，重新整理或返回時才不會又開一次；其他篩選參數保留。
 */
export function usePrefillFromUrl(open: (prefill: Prefill) => void) {
  useEffect(() => {
    const prefill = parsePrefill(window.location.search);
    if (!prefill) return;
    const p = new URLSearchParams(window.location.search);
    PREFILL_KEYS.forEach((k) => p.delete(k));
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    open(prefill);
    // 只在載入時讀一次網址
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
