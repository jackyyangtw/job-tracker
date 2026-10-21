'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { extractUrl } from '@/lib/mapping';
import { SOURCES, STATUS_LIST, type Application, type Source, type Status } from '@/lib/types';
import DiscardConfirm from './DiscardConfirm';
import Field from './Field';
import { useAppFormState } from './useAppFormState';
import { useDebugLog } from './useDebugLog';

interface Props {
  initial: Application | null;
  resumeOptions: string[];
  onSave: (app: Application) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export default function AppForm({ initial, resumeOptions, onSave, onDelete, onClose }: Props) {
  const { values: v, set, setUrl, setSource, dirty, toApplication } = useAppFormState(initial);
  const debug = useDebugLog();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const companyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  function requestClose() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  async function submit() {
    if (!v.company.trim()) {
      setError('請填公司名稱');
      companyRef.current?.focus();
      return;
    }
    setBusy(true);
    const ok = await onSave(toApplication());
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
    // Radix Dialog 負責焦點陷阱、Escape、鎖定捲動與 aria；關閉事件透過 onOpenChange 回報。
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
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
              <Input
                id="f-company"
                ref={companyRef}
                value={v.company}
                onChange={(e) => set('company', e.target.value)}
                autoComplete="off"
                maxLength={120}
                aria-invalid={!!error}
                aria-describedby={error ? 'f-company-error' : undefined}
              />
            </Field>
            <Field label="職位" id="f-title">
              <Input id="f-title" value={v.title} onChange={(e) => set('title', e.target.value)} autoComplete="off" maxLength={160} />
            </Field>
            <Field label="職缺連結" id="f-url" full>
              <Input
                id="f-url"
                value={v.url}
                inputMode="url"
                spellCheck={false}
                autoComplete="off"
                placeholder="貼上 104、Cake 或 LinkedIn 網址，來源會自動判斷"
                onChange={(e) => {
                  debug.log(`change len=${e.target.value.length} -> ${extractUrl(e.target.value)}`);
                  setUrl(e.target.value);
                }}
                // 直接讀剪貼簿，不依賴 onChange。104 App「分享 → 拷貝」會把說明文字和網址存成剪貼簿裡的
                // 不同項目，Safari 的純文字可能只有說明文字，所以網址格式（text/uri-list）也要一起找。
                onPaste={(e) => {
                  const data = e.clipboardData;
                  const text = data.getData('text');
                  const found = ['text/uri-list', 'text/plain']
                    .map((type) => extractUrl(data.getData(type)))
                    .find((candidate) => /^https?:\/\//i.test(candidate));
                  debug.log(
                    `paste ${[...data.types].map((t) => `${t}(${data.getData(t).length})`).join(', ')} -> ${found ?? '找不到網址'}`,
                  );
                  if (found && found !== text.trim()) {
                    e.preventDefault();
                    setUrl(found);
                  }
                }}
              />
              {debug.enabled ? <pre className="text-[11px] whitespace-pre-wrap text-muted-foreground">{debug.lines.join('\n')}</pre> : null}
            </Field>
            <Field label="來源" id="f-source">
              <NativeSelect id="f-source" wrapperClassName="w-full" value={v.source} onChange={(e) => setSource(e.target.value as Source)}>
                <option value="">（未選）</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="狀態" id="f-status">
              <NativeSelect id="f-status" wrapperClassName="w-full" value={v.status} onChange={(e) => set('status', e.target.value as Status)}>
                {STATUS_LIST.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="投遞日" id="f-applied">
              <Input id="f-applied" type="date" value={v.appliedAt} onChange={(e) => set('appliedAt', e.target.value)} />
            </Field>
            <Field label="下次跟進日" id="f-follow">
              <Input id="f-follow" type="date" value={v.followUpAt} onChange={(e) => set('followUpAt', e.target.value)} />
            </Field>
            <Field label="履歷版本" id="f-resume" full>
              <Input
                id="f-resume"
                list="resume-options"
                value={v.resume}
                onChange={(e) => set('resume', e.target.value)}
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
              <Textarea id="f-note" value={v.note} onChange={(e) => set('note', e.target.value)} placeholder="面試時間、聯絡人、薪資範圍…" maxLength={2000} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {initial ? (
              <>
                <Button type="button" variant={armed ? 'destructive-solid' : 'destructive'} onClick={() => void remove()} disabled={busy}>
                  {armed ? '再按一次確認刪除' : '刪除'}
                </Button>
                <span role="status" className="sr-only">
                  {armed ? '請再按一次以確認刪除，數秒後會自動取消' : ''}
                </span>
              </>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={requestClose} disabled={busy}>
                取消
              </Button>
              <Button type="submit" disabled={busy}>
                儲存
              </Button>
            </div>
          </div>
        </form>
        <DiscardConfirm open={confirmDiscard} onOpenChange={setConfirmDiscard} onDiscard={onClose} />
      </DialogContent>
    </Dialog>
  );
}
