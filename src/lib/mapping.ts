import { SOURCES, STATUS_LABEL, type Application, type ApplicationRow, type Source, type Status } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n);
/** Returns `YYYY-MM-DD` only for a date that really exists on the calendar (rejects 2026-13-99, 2026-02-30). */
function date(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.slice(0, 10);
  if (!DATE_RE.test(s)) return '';
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? s : '';
}

/** Accepts only http(s) links; adds https:// when the scheme is missing. Returns '' for anything else. */
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
 * Pulls the first http(s) link out of pasted share text, e.g. the message the 104 app copies:
 * "我在104工作快找上發現了一個超適合你的內容…
https://www.104.com.tw/job/8wgp3?jobsource=ios_share".
 * Returns the input unchanged when it contains no link, so typing a URL by hand still works.
 */
export function extractUrl(text: string): string {
  const m = text.match(/https?:\/\/[!-~]+/i);
  if (!m) return text;
  const url = m[0].replace(/[.,;:!?)\]}'"]+$/, '');
  try {
    const { hostname, pathname } = new URL(url);
    // 104 share links carry tracking parameters (?jobsource=ios_share); the job page works without them.
    if (/(^|\.)104\.com\.tw$/.test(hostname) && pathname.startsWith('/job/')) return url.split(/[?#]/)[0];
  } catch {
    // Half-typed URL: keep it as is.
  }
  return url;
}

export function detectSource(url: string): Source {
  let host = '';
  try {
    host = new URL(safeUrl(url)).hostname.toLowerCase();
  } catch {
    return '';
  }
  if (host.includes('104.com.tw')) return '104';
  if (host.includes('cake.me') || host.includes('cakeresume.com')) return 'Cake';
  if (host.includes('linkedin.com')) return 'LinkedIn';
  return '';
}

/** Validates and cleans anything that claims to be an application (imports, realtime payloads). */
export function normalizeApp(raw: unknown): Application | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const company = clip(r.company, 120).trim();
  if (!company) return null;
  const status = (r.status as Status) in STATUS_LABEL ? (r.status as Status) : 'applied';
  const srcRaw = String(r.source ?? '');
  const source: Source = (SOURCES as readonly string[]).includes(srcRaw) ? (srcRaw as Source) : srcRaw ? '其他' : '';
  const now = new Date().toISOString();
  return {
    // The database column is a uuid, so ids from older exports (e.g. the HTML prototype) get a fresh one.
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
    url: row.url ?? '',
    source: (SOURCES as readonly string[]).includes(row.source) ? (row.source as Source) : '',
    status: row.status in STATUS_LABEL ? (row.status as Status) : 'applied',
    appliedAt: row.applied_at ?? '',
    followUpAt: row.follow_up_at ?? '',
    lastContact: row.last_contact ?? '',
    resume: row.resume ?? '',
    note: row.note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Columns the client may write. user_id, created_at and updated_at are set by the database. */
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
