export type Status = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export const STATUS_LIST: { key: Status; label: string }[] = [
  { key: 'wishlist', label: '想投' },
  { key: 'applied', label: '已投遞' },
  { key: 'interview', label: '面試中' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: '未錄取' },
  { key: 'withdrawn', label: '已撤回' },
];

export const STATUS_LABEL: Record<Status, string> = Object.fromEntries(
  STATUS_LIST.map((s) => [s.key, s.label]),
) as Record<Status, string>;

export const SOURCES = ['104', 'Cake', 'LinkedIn', '內推', '公司官網', '其他'] as const;
export type Source = (typeof SOURCES)[number] | '';

/** "Got a reply": interview, offer, or a rejection. Withdrawn and wishlist do not count. */
export const REPLIED: Status[] = ['interview', 'offer', 'rejected'];

/** Dates are plain `YYYY-MM-DD` strings (no time zone), or '' when unset. */
export interface Application {
  id: string;
  company: string;
  title: string;
  url: string;
  source: Source;
  status: Status;
  appliedAt: string;
  followUpAt: string;
  lastContact: string;
  resume: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  /** Display-only example rows. Never written to the database. */
  sample?: boolean;
}

/** Row shape of public.applications (see supabase/migrations/0001_init.sql). */
export interface ApplicationRow {
  id: string;
  user_id?: string;
  company: string;
  title: string;
  url: string;
  source: string;
  status: string;
  applied_at: string | null;
  follow_up_at: string | null;
  last_contact: string | null;
  resume: string;
  note: string;
  created_at: string;
  updated_at: string;
}
