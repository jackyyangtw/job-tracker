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
export const PREFILL_KEYS = ['new', 'company', 'title', 'url', 'h104'] as const;

// 104 職缺 JSON 的 header 只有幾百字元；超過這個長度就不解析。
const MAX_H104 = 20_000;

// 長度上限和新增表單的 maxLength 一致。
const text = (v: unknown, n: number) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, n);

/**
 * 104 職缺 JSON 的 `data.header`（iOS 捷徑原樣轉傳），取出公司（custName）與職稱（jobName）。
 * 讓捷徑不必自己拆欄位、逐一編碼。格式不對時回傳空字串。
 */
function from104Header(raw: string | null): { company: string; title: string } {
  if (!raw || raw.length > MAX_H104) return { company: '', title: '' };
  try {
    const h = JSON.parse(raw) as { custName?: unknown; jobName?: unknown } | null;
    return { company: text(h?.custName, 120), title: text(h?.jobName, 160) };
  } catch {
    return { company: '', title: '' };
  }
}

/**
 * 解析 `/applications?new=1&company=…&title=…&url=…`，讓 iOS 捷徑、書籤小工具等外部工具
 * 開啟新增表單並帶入資料。沒有 `new` 參數時回傳 null（不開表單）；其他參數都可省略。
 * 也可以用 `h104`（104 職缺 JSON 的 header）代替 company／title，兩者都有時以 company／title 為準。
 * 網址一律經過 extractUrl／safeUrl，只接受 http(s)，來源由網址判斷。
 */
export function parsePrefill(search: string): Prefill | null {
  const p = new URLSearchParams(search);
  if (!p.has('new')) return null;
  const h104 = from104Header(p.get('h104'));
  const url = safeUrl(extractUrl(text(p.get('url'), 2000)));
  return {
    company: text(p.get('company'), 120) || h104.company,
    title: text(p.get('title'), 160) || h104.title,
    url,
    source: detectSource(url),
  };
}

/**
 * 「從剪貼簿新增」：剪貼簿是預填網址（iOS 捷徑拷貝的 `…?new=1&h104=…&url=…`）時照預填網址解析；
 * 是一般的職缺連結或分享訊息時只帶入連結。找不到 http(s) 連結時回傳 null。
 * 只讀網址參數，不管網域，所以捷徑裡的網域填錯也沒關係。
 */
export function parseClipboardPrefill(clip: string): Prefill | null {
  const found = extractUrl(clip.trim().slice(0, 50_000));
  if (!/^https?:\/\//i.test(found)) return null;
  let u: URL;
  try {
    u = new URL(found);
  } catch {
    return null;
  }
  if (u.searchParams.has('new')) return parsePrefill(u.search);
  const url = safeUrl(found);
  return url ? { company: '', title: '', url, source: detectSource(url) } : null;
}
