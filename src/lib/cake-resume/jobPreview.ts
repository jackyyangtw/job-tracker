// 貼上 Cake 職缺連結時自動帶入公司與職稱。
// 由 /api/cake-job-preview 路由（伺服器端）與表單（瀏覽器端）共用，這裡不能引入只能在伺服器執行的模組。
// 104 會封鎖雲端主機 IP，伺服器端查不到，所以只支援 Cake；104 改用 iOS 捷徑（docs/ios-shortcut.md）。

export interface CakeJobPreview {
  company: string;
  title: string;
}

/** Cake 職缺連結中的公司與職缺代碼，用來在伺服器端自己組出查詢網址。 */
export interface CakeJob {
  company: string;
  job: string;
}

const CAKE_HOST_RE = /^(?:www\.)?(?:cake\.me|cakeresume\.com)$/i;
// 網址路徑裡的一段：開頭必須是英數字，不允許 `..` 這類路徑。
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_.~%-]{0,199}$/;

/**
 * 解析 Cake 職缺連結（`https://www.cake.me/companies/{公司}/jobs/{職缺}`，舊網域 cakeresume.com 也接受）。
 * 其他連結回傳 null。
 */
export function parseCakeJobUrl(url: string): CakeJob | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (!CAKE_HOST_RE.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/companies\/([^/]+)\/jobs\/([^/]+)\/?$/);
  if (!m || !SLUG_RE.test(m[1]) || !SLUG_RE.test(m[2])) return null;
  return { company: m[1], job: m[2] };
}

/** 由驗證過的公司與職缺代碼組出 Cake 職缺頁網址；不使用使用者提供的網址（避免 SSRF）。 */
export const cakeJobPageUrl = ({ company, job }: CakeJob) => `https://www.cake.me/companies/${company}/jobs/${job}`;

const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** 在 JSON-LD 裡找 JobPosting（可能是單一物件、陣列或放在 @graph 裡）。 */
function findJobPosting(node: unknown): CakeJobPreview | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const found = findJobPosting(n);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  const o = node as { '@type'?: unknown; '@graph'?: unknown; title?: unknown; hiringOrganization?: { name?: unknown } };
  if (o['@type'] === 'JobPosting') {
    const company = clean(o.hiringOrganization?.name, 120);
    if (company) return { company, title: clean(o.title, 160) };
  }
  return findJobPosting(o['@graph']);
}

/**
 * 從 Cake 職缺頁的 HTML 取出公司與職稱：優先用 JSON-LD 的 JobPosting，
 * 沒有的話用 og:title（格式是「職稱 - 公司 | Cake」）。都找不到時回傳 null。
 */
export function parseCakeJobPage(html: string): CakeJobPreview | null {
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const found = findJobPosting(JSON.parse(m[1]));
      if (found) return found;
    } catch {
      // 格式不對的區塊略過
    }
  }
  const og = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1];
  const parts = og ? decodeEntities(og).match(/^(.*) - (.+?) \| Cake$/) : null;
  if (!parts) return null;
  const company = clean(parts[2], 120);
  return company ? { company, title: clean(parts[1], 160) } : null;
}

export type CakePreviewFailure = 'unauthorized' | 'blocked' | 'failed';

/** 請自己的 API 查詢職缺。失敗時回傳原因：登入過期、Cake 拒絕（或無法連線），或其他。 */
export async function fetchCakeJobPreview(url: string): Promise<{ preview: CakeJobPreview } | { failure: CakePreviewFailure }> {
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
