import type { Source } from '../types';
import { detectSource, extractUrl, safeUrl } from './mapping';

/** 從網址參數預填到新增表單的欄位。 */
export interface Prefill {
  company: string;
  title: string;
  url: string;
  source: Source;
}

/** 讀完要從網址上拿掉的參數，重新整理時才不會又跳出新增表單。 */
export const PREFILL_KEYS = ['new', 'company', 'title', 'url'] as const;

// 長度上限和新增表單的 maxLength 一致。
const text = (v: string | null, n: number) => (v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/**
 * 解析 `/applications?new=1&company=…&title=…&url=…`，讓 iOS 捷徑、書籤小工具等外部工具
 * 開啟新增表單並帶入資料。沒有 `new` 參數時回傳 null（不開表單）；其他參數都可省略。
 * 網址一律經過 extractUrl／safeUrl，只接受 http(s)，來源由網址判斷。
 */
export function parsePrefill(search: string): Prefill | null {
  const p = new URLSearchParams(search);
  if (!p.has('new')) return null;
  const url = safeUrl(extractUrl(text(p.get('url'), 2000)));
  return {
    company: text(p.get('company'), 120),
    title: text(p.get('title'), 160),
    url,
    source: detectSource(url),
  };
}
