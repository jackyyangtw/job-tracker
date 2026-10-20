'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { addDays, todayStr } from '@/lib/dates';
import { detectSource, safeUrl } from '@/lib/mapping';
import { SOURCES, STATUS_LIST, type Application, type Source, type Status } from '@/lib/types';

interface Props {
  initial: Application | null;
  resumeOptions: string[];
  onSave: (app: Application) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export default function AppForm({ initial, resumeOptions, onSave, onDelete, onClose }: Props) {
  const [company, setCompany] = useState(initial?.company ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [source, setSource] = useState<Source>(initial?.source ?? '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'applied');
  const [appliedAt, setAppliedAt] = useState(initial ? initial.appliedAt : todayStr());
  const [followUpAt, setFollowUpAt] = useState(initial ? initial.followUpAt : addDays(7));
  const [resume, setResume] = useState(initial?.resume ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const sourceTouched = useRef(!!initial?.source);
  const companyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  function onUrlChange(v: string) {
    setUrl(v);
    const s = detectSource(v);
    if (s && !sourceTouched.current) setSource(s);
  }

  async function submit() {
    if (!company.trim()) {
      setError('請填公司名稱');
      companyRef.current?.focus();
      return;
    }
    setBusy(true);
    const now = new Date().toISOString();
    const app: Application = {
      id: initial?.id ?? crypto.randomUUID(),
      company: company.trim(),
      title: title.trim(),
      url: safeUrl(url),
      source,
      status,
      appliedAt: status !== 'wishlist' && !appliedAt ? todayStr() : appliedAt,
      followUpAt,
      lastContact: initial?.lastContact ?? '',
      resume: resume.trim(),
      note: note.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = await onSave(app);
    setBusy(false);
    if (ok) onClose();
  }

  async function remove() {
    if (!initial) return;
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    const ok = await onDelete(initial.id);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    // Radix Dialog handles focus trapping, Escape, scroll lock and aria; closing is reported through onOpenChange.
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby="form-desc"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          companyRef.current?.focus();
        }}
      >
        <DialogTitle>{initial ? '編輯投遞' : '新增投遞'}</DialogTitle>
        <DialogDescription id="form-desc">填寫公司、職位、來源與跟進日期後儲存。</DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="公司 *" id="f-company" error={error}>
              <Input id="f-company" ref={companyRef} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" maxLength={120} aria-invalid={!!error} />
            </Field>
            <Field label="職位" id="f-title">
              <Input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" maxLength={160} />
            </Field>
            <Field label="職缺連結" id="f-url" full>
              <Input
                id="f-url"
                value={url}
                inputMode="url"
                autoComplete="off"
                placeholder="貼上 104、Cake 或 LinkedIn 網址，來源會自動判斷"
                onChange={(e) => onUrlChange(e.target.value)}
              />
            </Field>
            <Field label="來源" id="f-source">
              <NativeSelect
                id="f-source"
                wrapperClassName="w-full"
                value={source}
                onChange={(e) => {
                  sourceTouched.current = true;
                  setSource(e.target.value as Source);
                }}
              >
                <option value="">（未選）</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="狀態" id="f-status">
              <NativeSelect id="f-status" wrapperClassName="w-full" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {STATUS_LIST.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="投遞日" id="f-applied">
              <Input id="f-applied" type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
            </Field>
            <Field label="下次跟進日" id="f-follow">
              <Input id="f-follow" type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
            </Field>
            <Field label="履歷版本" id="f-resume" full>
              <Input
                id="f-resume"
                list="resume-options"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                autoComplete="off"
                placeholder="例如 v2-強調 Next.js"
                maxLength={80}
              />
              <datalist id="resume-options">
                {resumeOptions.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </Field>
            <Field label="備註" id="f-note" full>
              <Textarea id="f-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="面試時間、聯絡人、薪資範圍…" maxLength={2000} />
            </Field>
          </div>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {initial ? (
            <Button type="button" variant={armed ? 'destructive-solid' : 'destructive'} onClick={() => void remove()} disabled={busy}>
              {armed ? '再按一次確認刪除' : '刪除'}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              取消
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={busy}>
              儲存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, error, full, children }: { label: string; id: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1${full ? ' sm:col-span-2' : ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
