// 貼上 Cake 職缺連結時自動帶入公司與職稱：/api/cake-job-preview 用這裡解析職缺頁。
// 連結的解析在 jobUrl.ts；表單呼叫 API 的部分在 components/AppForm/useCakeJobPreview.ts。
// 104 會封鎖雲端主機 IP，伺服器端查不到，所以只支援 Cake；104 改用 iOS 捷徑（docs/ios-shortcut.md）。

export interface CakeJobPreview {
  company: string;
  title: string;
}

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
