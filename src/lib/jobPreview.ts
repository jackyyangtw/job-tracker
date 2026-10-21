// 由 /api/job-preview 路由（伺服器端）與表單（瀏覽器端）共用，這裡不能引入只能在伺服器執行的模組。

export interface JobPreview {
  company: string;
  title: string;
}

const JOB_104_RE = /^https?:\/\/(?:www\.)?104\.com\.tw\/job\/([0-9a-z]{4,12})(?:[/?#]|$)/i;

/** 104 職缺連結裡的職缺代碼（`https://www.104.com.tw/job/8wgp3` -> `8wgp3`）；其他連結回傳 null。 */
export function parse104JobId(url: string): string | null {
  const m = url.trim().match(JOB_104_RE);
  return m ? m[1].toLowerCase() : null;
}

/** 從 104 職缺 JSON 取出公司與職稱。格式不如預期時回傳 null。 */
export function parse104Job(json: unknown): JobPreview | null {
  const header = (json as { data?: { header?: { jobName?: unknown; custName?: unknown } } } | null)?.data?.header;
  const company = typeof header?.custName === 'string' ? header.custName.trim().slice(0, 120) : '';
  const title = typeof header?.jobName === 'string' ? header.jobName.trim().slice(0, 160) : '';
  return company ? { company, title } : null;
}

export type PreviewFailure = 'unauthorized' | 'blocked' | 'failed';

/** 請自己的 API 查詢職缺。失敗時回傳原因：登入過期、104 拒絕（或無法連線），或其他。 */
export async function fetchJobPreview(url: string): Promise<{ preview: JobPreview } | { failure: PreviewFailure }> {
  try {
    const res = await fetch(`/api/job-preview?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 401) return { failure: 'unauthorized' };
    if (res.status === 502) return { failure: 'blocked' };
    if (!res.ok) return { failure: 'failed' };
    const data = (await res.json()) as Partial<JobPreview> | null;
    if (typeof data?.company !== 'string' || !data.company) return { failure: 'failed' };
    return { preview: { company: data.company, title: typeof data.title === 'string' ? data.title : '' } };
  } catch {
    return { failure: 'failed' };
  }
}
