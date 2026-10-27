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

// 用 Object.hasOwn 而不是 `in`：`in` 會把 toString、constructor 這類原型上的名稱也當成合法狀態。
export const isStatus = (v: unknown): v is Status => typeof v === 'string' && Object.hasOwn(STATUS_LABEL, v);

export const SOURCES = ['104', 'Cake', 'LinkedIn', '內推', '公司官網', '其他'] as const;
export type Source = (typeof SOURCES)[number] | '';

/** 「有回應」：面試、Offer 或收到婉拒。已撤回與想投不算。 */
export const REPLIED: Status[] = ['interview', 'offer', 'rejected'];

/** 日期是單純的 `YYYY-MM-DD` 字串（不含時區），未設定時是 ''。 */
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
  /** 只用來顯示的範例資料，絕不會寫入資料庫。 */
  sample?: boolean;
}

/** public.applications 的資料列格式（見 supabase/migrations/0001_init.sql）。 */
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
