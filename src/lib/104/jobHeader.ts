// 104 職缺 JSON 的 `data.header`：iOS 捷徑查詢 `https://www.104.com.tw/job/ajax/content/{職缺代碼}` 後原樣轉傳（`h104` 參數）。
// 104 會封鎖雲端主機 IP，伺服器端查不到，所以由使用者的手機查詢（見 docs/ios-shortcut.md）。

export interface Job104 {
  company: string;
  title: string;
}

// header 只有幾百字元；超過這個長度就不解析。
const MAX_LENGTH = 20_000;

// 長度上限和新增表單的 maxLength 一致。
const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

/** 從 header 的 JSON 字串取出公司（custName）與職稱（jobName）。格式不對、欄位不是字串或太長時回傳空字串。 */
export function parse104JobHeader(raw: string | null): Job104 {
  if (!raw || raw.length > MAX_LENGTH) return { company: '', title: '' };
  try {
    const h = JSON.parse(raw) as { custName?: unknown; jobName?: unknown } | null;
    return { company: clean(h?.custName, 120), title: clean(h?.jobName, 160) };
  } catch {
    return { company: '', title: '' };
  }
}
