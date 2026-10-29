// Cake（CakeResume）的連結：判斷網域、解析職缺連結，以及由解析結果組出查詢網址。

/** Cake 職缺連結中的公司與職缺代碼，用來在伺服器端自己組出查詢網址。 */
export interface CakeJob {
  company: string;
  job: string;
}

/** 是不是 Cake 的網域（cake.me、舊網域 cakeresume.com 與其子網域）；用來判斷投遞來源。 */
export const isCakeHost = (hostname: string) => /(^|\.)(?:cake\.me|cakeresume\.com)$/i.test(hostname);

// 查詢職缺時只接受主網域與 www，比 isCakeHost 嚴格。
const JOB_HOST_RE = /^(?:www\.)?(?:cake\.me|cakeresume\.com)$/i;
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
  if (!JOB_HOST_RE.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/companies\/([^/]+)\/jobs\/([^/]+)\/?$/);
  if (!m || !SLUG_RE.test(m[1]) || !SLUG_RE.test(m[2])) return null;
  return { company: m[1], job: m[2] };
}

/** 由驗證過的公司與職缺代碼組出 Cake 職缺頁網址；不使用使用者提供的網址（避免 SSRF）。 */
export const cakeJobPageUrl = ({ company, job }: CakeJob) => `https://www.cake.me/companies/${company}/jobs/${job}`;
