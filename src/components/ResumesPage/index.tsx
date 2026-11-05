'use client';

import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { resumeUsage, type ResumeDraft } from '@/lib/resumes/resume';
import type { Resume } from '@/lib/types';
import ResumeForm from './ResumeForm';
import ResumeItem from './ResumeItem';

/** 履歷頁：管理每一版履歷（網址或 PDF），新增或編輯投遞時可以選擇用了哪一版。 */
export default function ResumesPage() {
  const { isDemo, apps, resumes, resumesLoaded, resumeHref, saveResume, removeResume } = useShell();
  // 表單開著時的編輯對象；null 代表新增
  const [form, setForm] = useState<{ open: boolean; resume: Resume | null }>({ open: false, resume: null });
  const usage = resumeUsage(apps);

  async function save(draft: ResumeDraft, current: Resume | null) {
    const ok = await saveResume(draft, current);
    if (ok) toast(current ? '已更新履歷版本' : '已新增履歷版本');
    return ok;
  }

  async function remove(resume: Resume) {
    const ok = await removeResume(resume);
    if (ok) toast('已刪除履歷版本');
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-bold">履歷版本</h1>
          {/* 限制行寬，大螢幕上說明文字不會橫跨整個畫面 */}
          <p className="max-w-[60ch] text-sm text-muted-foreground">
            管理不同職缺使用的履歷版本，新增或編輯投遞時可以選擇用了哪一版；PDF 會在新分頁直接預覽。
            {isDemo ? '試用模式上傳的 PDF 只存在這個分頁。' : null}
          </p>
        </div>
        {/* 手機版改用右下角的漂浮按鈕 */}
        <Button type="button" className="shrink-0 max-md:hidden" onClick={() => setForm({ open: true, resume: null })}>
          <Plus aria-hidden />
          新增版本
        </Button>
      </div>

      {!resumesLoaded ? (
        <div aria-busy className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-[130px] animate-pulse rounded-[10px] bg-secondary" />
          ))}
        </div>
      ) : resumes.length ? (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
          {resumes.map((r) => (
            <li key={r.id}>
              <ResumeItem
                resume={r}
                href={resumeHref(r)}
                usedBy={usage.get(r.id) ?? 0}
                onEdit={() => setForm({ open: true, resume: r })}
                onRemove={() => remove(r)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="items-center gap-2 rounded-[10px] py-8 text-center">
          <FileText aria-hidden className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">還沒有履歷版本</p>
          <p className="max-w-sm text-xs text-muted-foreground">新增一個版本：貼上 Cake、Google 雲端硬碟等履歷網址，或上傳 PDF。</p>
        </Card>
      )}

      {form.open ? (
        <ResumeForm
          key={form.resume?.id ?? 'new'}
          current={form.resume}
          all={resumes}
          onSave={save}
          onClose={() => setForm({ open: false, resume: null })}
        />
      ) : null}

      {/* 手機版：與投遞頁一致，漂浮在底部分頁列上方的右下角 */}
      <Button
        type="button"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 h-12 rounded-full px-5 shadow-lg md:hidden pointer-coarse:h-12"
        onClick={() => setForm({ open: true, resume: null })}
      >
        <Plus aria-hidden />
        新增版本
      </Button>
    </main>
  );
}
