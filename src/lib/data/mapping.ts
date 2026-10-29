import { clean104JobUrl, is104Host } from '../104/jobUrl';
import { isCakeHost } from '../cake-resume/jobUrl';
import { isStatus, SOURCES, type Application, type ApplicationRow, type Source, type Status } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n);
/** 只有日曆上真的存在的日期才回傳 `YYYY-MM-DD`（會拒絕 2026-13-99、2026-02-30）。 */
function date(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.slice(0, 10);
  if (!DATE_RE.test(s)) return '';
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? s : '';
}

/** 只接受 http(s) 連結；缺少協定時補上 https://。其他一律回傳 ''。 */
export function safeUrl(input: unknown): string {
  let u = String(input ?? '').trim();
  if (!u) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `https://${u}`;
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:' ? x.href.slice(0, 2000) : '';
  } catch {
    return '';
  }
}

/**
 * 從貼上的分享文字裡取出第一個 http(s) 連結（求職 App 分享出來的常是一段說明文字加連結）。
 * 文字裡沒有連結就原樣回傳，所以手動輸入網址仍然可以。各網站的連結清理（例如追蹤參數）交給該網站的模組。
 */
export function extractUrl(text: string): string {
  const m = text.match(/https?:\/\/[!-~]+/i);
  if (!m) return text;
  return clean104JobUrl(m[0].replace(/[.,;:!?)\]}'"]+$/, ''));
}

export function detectSource(url: string): Source {
  let host = '';
  try {
    host = new URL(safeUrl(url)).hostname.toLowerCase();
  } catch {
    return '';
  }
  if (is104Host(host)) return '104';
  if (isCakeHost(host)) return 'Cake';
  if (host.includes('linkedin.com')) return 'LinkedIn';
  return '';
}

/** 驗證並清理任何自稱是投遞資料的內容（匯入檔、Realtime 推送）。 */
export function normalizeApp(raw: unknown): Application | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const company = clip(r.company, 120).trim();
  if (!company) return null;
  const status: Status = isStatus(r.status) ? r.status : 'applied';
  const srcRaw = String(r.source ?? '');
  const source: Source = (SOURCES as readonly string[]).includes(srcRaw) ? (srcRaw as Source) : srcRaw ? '其他' : '';
  const now = new Date().toISOString();
  return {
    // 資料庫欄位是 uuid，所以舊版匯出檔（例如 HTML 原型）的 id 會重新產生。
    id: typeof r.id === 'string' && UUID_RE.test(r.id) ? r.id : crypto.randomUUID(),
    company,
    title: clip(r.title, 160),
    url: safeUrl(r.url),
    source,
    status,
    appliedAt: date(r.appliedAt),
    followUpAt: date(r.followUpAt),
    lastContact: date(r.lastContact),
    resume: clip(r.resume, 80),
    note: clip(r.note, 2000),
    createdAt: clip(r.createdAt, 40) || now,
    updatedAt: clip(r.updatedAt, 40) || now,
  };
}

export function fromRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    title: row.title ?? '',
    // 資料庫的 check constraint 只在 0002 之後才有，Realtime 推送也直接來自資料列，所以讀進來時再過濾一次。
    url: safeUrl(row.url),
    source: (SOURCES as readonly string[]).includes(row.source) ? (row.source as Source) : '',
    status: isStatus(row.status) ? row.status : 'applied',
    appliedAt: row.applied_at ?? '',
    followUpAt: row.follow_up_at ?? '',
    lastContact: row.last_contact ?? '',
    resume: row.resume ?? '',
    note: row.note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 前端可以寫入的欄位。user_id、created_at、updated_at 由資料庫設定。 */
export function toRow(a: Application) {
  return {
    id: a.id,
    company: a.company,
    title: a.title,
    url: a.url,
    source: a.source,
    status: a.status,
    applied_at: a.appliedAt || null,
    follow_up_at: a.followUpAt || null,
    last_contact: a.lastContact || null,
    resume: a.resume,
    note: a.note,
  };
}
