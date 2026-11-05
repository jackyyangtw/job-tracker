'use client';

import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { validateResumeDraft, type ResumeDraft, type ResumeDraftErrors } from '@/lib/resumes/resume';
import type { Resume, ResumeKind } from '@/lib/types';

interface Props {
  /** 正在編輯的版本；新增時是 null。 */
  current: Resume | null;
  /** 所有版本，用來檢查名稱是否重複。 */
  all: readonly Resume[];
  onSave: (draft: ResumeDraft, current: Resume | null) => Promise<boolean>;
  onClose: () => void;
}

/** 新增或編輯履歷版本：名稱，加上一個網址或一份 PDF。 */
export default function ResumeForm({ current, all, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ResumeDraft>(() => ({
    name: current?.name ?? '',
    kind: current?.kind ?? 'url',
    url: current?.url ?? '',
    file: null,
  }));
  const [errors, setErrors] = useState<ResumeDraftErrors>({});
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key === 'kind' ? 'file' : key]: undefined }));
  };

  async function submit() {
    const found = validateResumeDraft(draft, current, all);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (Object.keys(found).length) return;
    setBusy(true);
    const ok = await onSave(draft, current);
    setBusy(false);
    if (ok) onClose();
  }

  // 已經上傳過、這次沒有換檔案時顯示原本的檔名。
  const fileLabel = draft.file?.name ?? (current?.kind === 'pdf' ? current.fileName : '');

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent
        aria-describedby="resume-form-desc"
        className="max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          nameRef.current?.focus();
        }}
      >
        <DialogTitle>{current ? '編輯履歷版本' : '新增履歷版本'}</DialogTitle>
        <DialogDescription id="resume-form-desc">填寫版本名稱，並貼上履歷網址或上傳 PDF。</DialogDescription>
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="r-name">
              版本名稱<span aria-hidden> *</span>
            </Label>
            <Input
              id="r-name"
              ref={nameRef}
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="例如 v2 強調 Next.js"
              autoComplete="off"
              maxLength={80}
              aria-required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'r-name-error' : undefined}
            />
            <FieldError id="r-name-error" message={errors.name} />
          </div>

          <div className="flex flex-col gap-1">
            <span id="r-kind-label" className="text-sm font-medium">
              類型
            </span>
            <ToggleGroup
              type="single"
              aria-labelledby="r-kind-label"
              className="self-start"
              value={draft.kind}
              // 再按一次已選的項目時 Radix 會傳空字串，忽略它，維持一定有選一個。
              onValueChange={(v) => v && set('kind', v as ResumeKind)}
            >
              <ToggleGroupItem value="url">網址</ToggleGroupItem>
              <ToggleGroupItem value="pdf">PDF</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {draft.kind === 'url' ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor="r-url">
                履歷網址<span aria-hidden> *</span>
              </Label>
              <Input
                id="r-url"
                type="url"
                value={draft.url}
                onChange={(e) => set('url', e.target.value)}
                placeholder="https://www.cake.me/me/…"
                spellCheck={false}
                autoComplete="off"
                aria-required
                aria-invalid={!!errors.url}
                aria-describedby={errors.url ? 'r-url-error' : undefined}
              />
              <FieldError id="r-url-error" message={errors.url} />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span id="r-file-label" className="text-sm font-medium">
                PDF 檔案<span aria-hidden> *</span>
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  aria-describedby={errors.file ? 'r-file-error r-file-hint' : 'r-file-hint'}
                >
                  <FileUp aria-hidden />
                  {fileLabel ? '更換檔案' : '選擇 PDF'}
                </Button>
                {fileLabel ? <span className="min-w-0 truncate text-sm">{fileLabel}</span> : null}
              </div>
              <p id="r-file-hint" className="text-xs text-muted-foreground">
                最大 10 MB。只有你自己看得到，開啟時會在新分頁預覽。
              </p>
              <FieldError id="r-file-error" message={errors.file} />
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                aria-labelledby="r-file-label"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) set('file', file);
                  // 清空，再選同一個檔案時也會觸發 onChange。
                  e.target.value = '';
                }}
              />
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              取消
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (draft.file ? '上傳中…' : '儲存中…') : '儲存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <div id={id} role="alert" className="text-xs text-destructive">
      {message}
    </div>
  );
}
