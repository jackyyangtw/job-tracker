'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { extractUrl } from '@/lib/data/mapping';
import type { Prefill } from '@/lib/data/prefill';
import { SOURCES, STATUS_LIST, type Application, type Source, type Status } from '@/lib/types';
import DiscardConfirm from './DiscardConfirm';
import Field from './Field';
import CakePreviewHint from './CakePreviewHint';
import { useAppFormState } from './useAppFormState';
import { useCakeJobPreview } from './useCakeJobPreview';

interface Props {
  initial: Application | null;
  /** 新增時預先帶入的欄位（來自網址參數）。 */
  prefill?: Prefill | null;
  /** 試用模式：沒有登入，不查詢 Cake 職缺。 */
  isDemo?: boolean;
  resumeOptions: string[];
  onSave: (app: Application) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export default function AppForm({ initial, prefill, isDemo = false, resumeOptions, onSave, onDelete, onClose }: Props) {
  const { values: v, set, setUrl, setSource, applyCakePreview, dirty, toApplication } = useAppFormState(initial, prefill);
  const cakePreview = useCakeJobPreview(applyCakePreview, !isDemo);
  const [error, setError] = useState('');
  // 正在進行的操作，用來停用按鈕並在對應的按鈕上顯示進度
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
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

  // 公司或職位還是空的才去查 Cake 職缺，所以編輯已填好的資料時不會呼叫 API。
  function lookUpCake(url: string) {
    if (!v.company.trim() || !v.title.trim()) cakePreview.request(url);
  }

  async function submit() {
    if (!v.company.trim()) {
      setError('請填公司名稱');
      companyRef.current?.focus();
      return;
    }
    setBusy('save');
    const ok = await onSave(toApplication());
    setBusy(null);
    if (ok) onClose();
  }

  async function remove() {
    if (!initial) return;
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy('delete');
    const ok = await onDelete(initial.id);
    setBusy(null);
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
            <Field label="公司" id="f-company" error={error} required>
              <Input
                id="f-company"
                name="company"
                ref={companyRef}
                value={v.company}
                onChange={(e) => set('company', e.target.value)}
                autoComplete="off"
                maxLength={120}
                aria-required
                aria-invalid={!!error}
                aria-describedby={error ? 'f-company-error' : undefined}
              />
            </Field>
            <Field label="職位" id="f-title">
              <Input id="f-title" name="title" value={v.title} onChange={(e) => set('title', e.target.value)} autoComplete="off" maxLength={160} />
            </Field>
            <Field label="職缺連結" id="f-url" hint="貼上 104、Cake 或 LinkedIn 網址，來源會自動判斷；Cake 連結會帶入公司與職稱" full>
              <Input
                id="f-url"
                name="url"
                type="url"
                value={v.url}
                spellCheck={false}
                autoComplete="off"
                placeholder="https://www.104.com.tw/job/…"
                aria-describedby="f-url-hint"
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => lookUpCake(v.url)}
                // 直接讀剪貼簿，不依賴 onChange。104 App「分享 → 拷貝」會把說明文字和網址存成剪貼簿裡的
                // 不同項目，Safari 的純文字可能只有說明文字，所以網址格式（text/uri-list）也要一起找。
                onPaste={(e) => {
                  const data = e.clipboardData;
                  const text = data.getData('text');
                  const found = ['text/uri-list', 'text/plain']
                    .map((type) => extractUrl(data.getData(type)))
                    .find((candidate) => /^https?:\/\//i.test(candidate));
                  if (found && found !== text.trim()) {
                    e.preventDefault();
                    setUrl(found);
                  }
                  // 清理貼上的內容之後才查詢職缺，查詢出任何問題都不會影響貼上。
                  lookUpCake(found ?? extractUrl(text));
                }}
              />
              <CakePreviewHint status={cakePreview.status} />
            </Field>
            <Field label="來源" id="f-source">
              <NativeSelect id="f-source" name="source" wrapperClassName="w-full" value={v.source} onChange={(e) => setSource(e.target.value as Source)}>
                <option value="">（未選）</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="狀態" id="f-status">
              <NativeSelect id="f-status" name="status" wrapperClassName="w-full" value={v.status} onChange={(e) => set('status', e.target.value as Status)}>
                {STATUS_LIST.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="投遞日" id="f-applied">
              <Input id="f-applied" name="appliedAt" type="date" value={v.appliedAt} onChange={(e) => set('appliedAt', e.target.value)} />
            </Field>
            <Field label="下次跟進日" id="f-follow">
              <Input id="f-follow" name="followUpAt" type="date" value={v.followUpAt} onChange={(e) => set('followUpAt', e.target.value)} />
            </Field>
            <Field label="履歷版本" id="f-resume" full>
              <Input
                id="f-resume"
                name="resume"
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
              <Textarea id="f-note" name="note" value={v.note} onChange={(e) => set('note', e.target.value)} placeholder="面試時間、聯絡人、薪資範圍…" maxLength={2000} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {initial ? (
              <>
                <Button type="button" variant={armed ? 'destructive-solid' : 'destructive'} onClick={() => void remove()} disabled={!!busy}>
                  {busy === 'delete' ? '刪除中…' : armed ? '再按一次確認刪除' : '刪除'}
                </Button>
                <span role="status" className="sr-only">
                  {armed ? '請再按一次以確認刪除，數秒後會自動取消' : ''}
                </span>
              </>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={requestClose} disabled={!!busy}>
                取消
              </Button>
              <Button type="submit" disabled={!!busy}>
                {busy === 'save' ? '儲存中…' : '儲存'}
              </Button>
            </div>
          </div>
        </form>
        <DiscardConfirm open={confirmDiscard} onOpenChange={setConfirmDiscard} onDiscard={onClose} />
      </DialogContent>
    </Dialog>
  );
}
