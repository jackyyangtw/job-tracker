import { safeUrl } from '../data/mapping';
import type { Application, Resume, ResumeKind } from '../types';

/** 和 Storage bucket 的 file_size_limit 一致（0006_resumes.sql）。 */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** 履歷表單送出的內容。`file` 是新選的 PDF；編輯既有 PDF 版本時可以不換檔案。 */
export interface ResumeDraft {
  name: string;
  kind: ResumeKind;
  url: string;
  file: File | null;
}

export type ResumeDraftErrors = Partial<Record<'name' | 'url' | 'file', string>>;

/** PDF 在 Storage 的路徑。第一層資料夾必須是使用者 id，Storage 的 RLS 依此判斷擁有者。 */
export const resumeFilePath = (userId: string, resumeId: string) => `${userId}/${resumeId}.pdf`;

/** 有些瀏覽器（或從雲端硬碟挑的檔案）不會給 MIME type，所以副檔名也算。 */
export function isPdfFile(file: Pick<File, 'name' | 'type'>): boolean {
  return file.type === 'application/pdf' || (!file.type && /\.pdf$/i.test(file.name));
}

/**
 * 檢查履歷表單。`current` 是正在編輯的版本（新增時是 null），
 * 用來判斷 PDF 版本是否已經有檔案、名稱重複時是否就是自己。
 */
export function validateResumeDraft(draft: ResumeDraft, current: Resume | null, all: readonly Resume[]): ResumeDraftErrors {
  const errors: ResumeDraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = '請填版本名稱';
  else if (name.length > 80) errors.name = '名稱最多 80 個字';
  else if (all.some((r) => r.id !== current?.id && r.name === name)) errors.name = '已經有同名的版本';

  if (draft.kind === 'url') {
    if (!draft.url.trim()) errors.url = '請填履歷網址';
    else if (!safeUrl(draft.url)) errors.url = '只接受 http 或 https 網址';
  } else if (draft.file) {
    if (!isPdfFile(draft.file)) errors.file = '只能上傳 PDF 檔';
    else if (draft.file.size > MAX_PDF_BYTES) errors.file = 'PDF 最大 10 MB';
    else if (draft.file.size === 0) errors.file = '檔案是空的';
  } else if (!(current?.kind === 'pdf' && current.filePath)) {
    errors.file = '請選擇 PDF 檔';
  }
  return errors;
}

/** 每個履歷版本用在幾筆投遞上。 */
export function resumeUsage(apps: readonly Application[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const a of apps) if (a.resumeId) usage.set(a.resumeId, (usage.get(a.resumeId) ?? 0) + 1);
  return usage;
}

/** 版本改名後，把用到它的投遞上的名稱一起改掉（資料庫由 trigger 處理，這個給試用模式用）。 */
export function renameResumeInApps(apps: Application[], resume: Pick<Resume, 'id' | 'name'>): Application[] {
  return apps.map((a) => (a.resumeId === resume.id && a.resume !== resume.name ? { ...a, resume: resume.name } : a));
}

/** 刪除版本後，投遞上只清掉 id、保留名稱當紀錄（和資料庫的 on delete set null 相同）。 */
export function detachResumeFromApps(apps: Application[], resumeId: string): Application[] {
  return apps.map((a) => (a.resumeId === resumeId ? { ...a, resumeId: '' } : a));
}

/** 職缺連結、履歷網址只顯示網域，完整網址放在 title。 */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
