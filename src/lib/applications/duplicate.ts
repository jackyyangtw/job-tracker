import { clean104JobUrl, is104Host } from "../104/jobUrl";
import { cakeJobPageUrl, parseCakeJobUrl } from "../cake-resume/jobUrl";
import type { Application } from "../types";

// 不影響職缺內容的追蹤參數：utm_*、廣告點擊代碼，以及 104、LinkedIn、Cake 分享時加上的參數。
const TRACKING_PARAM_RE =
  /^(?:utm_.*|fbclid|gclid|msclkid|jobsource|ref|refid|trackingid|trk|src)$/i;

/**
 * 把職缺連結整理成可以直接比較的字串：去掉通訊協定、`www.`、追蹤參數、# 片段與結尾斜線，並轉成小寫。
 * 104 職缺只看職缺代碼（不分 www／m 子網域），Cake 職缺統一成 cake.me 的網址（舊網域 cakeresume.com 也算同一筆）。
 * 不是完整網址時只做去空白、小寫與去結尾斜線。空字串回傳 ''。
 */
export function normalizeJobUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const cake = parseCakeJobUrl(trimmed);
  const url = cake ? cakeJobPageUrl(cake) : clean104JobUrl(trimmed);
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
  const host = is104Host(u.hostname)
    ? "104.com.tw"
    : u.hostname.replace(/^www\./i, "");
  const params = [...u.searchParams]
    .filter(([key]) => !TRACKING_PARAM_RE.test(key))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? `?${new URLSearchParams(params)}` : "";
  return `${host}${u.pathname.replace(/\/+$/, "")}${query}`.toLowerCase();
}

const companyTitleKey = (a: Pick<Application, "company" | "title">) =>
  `${a.company.trim().toLowerCase()}\n${a.title.trim().toLowerCase()}`;

/**
 * 在既有投遞中找出和 `app` 相同的職缺，找不到回傳 null。
 * - 兩筆都有職缺連結：整理後的連結相同才算重複。
 * - 任一筆沒有連結：公司加職位相同（去頭尾空白、不分大小寫）就算重複。
 * 範例資料與同一筆（相同 id）不列入比對。
 */
export function findDuplicate(
  app: Application,
  existing: readonly Application[],
): Application | null {
  if (!app.company.trim()) return null;
  const url = normalizeJobUrl(app.url);
  const key = companyTitleKey(app);
  for (const other of existing) {
    if (other.sample || other.id === app.id) continue;
    const otherUrl = normalizeJobUrl(other.url);
    if (url && otherUrl ? url === otherUrl : key === companyTitleKey(other))
      return other;
  }
  return null;
}
