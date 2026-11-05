'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { mergeApplication } from '@/lib/applications/applicationList';
import { demoApps, demoResumes } from '@/lib/applications/demo';
import { safeUrl } from '@/lib/data/mapping';
import { detachResumeFromApps, renameResumeInApps, type ResumeDraft } from '@/lib/resumes/resume';
import type { Application, Resume } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';
import type { Shell } from './ShellContext';
import ShellFrame from './ShellFrame';

/**
 * 試用模式（/demo）的外殼：不需要登入，資料只存在這個元件的 state 裡，
 * 所有新增、修改、刪除與匯入都不會碰到 Supabase。重新整理就回到初始範例。
 * 上傳的 PDF 只轉成這個分頁的 blob 網址，不會離開瀏覽器。
 */
export default function DemoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [apps, setApps] = useState(demoApps);
  const [resumes, setResumes] = useState(demoResumes);
  // 履歷 id → 上傳 PDF 的 blob 網址
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const changeStaleDays = useTrackerStore((s) => s.setStaleDays);

  async function upsert(app: Application) {
    setApps((list) => mergeApplication(list, { ...app, updatedAt: new Date().toISOString() }));
    return true;
  }

  async function remove(id: string) {
    setApps((list) => list.filter((a) => a.id !== id));
    return true;
  }

  async function importMany(items: Application[]) {
    setApps((list) => items.reduce(mergeApplication, list));
    return items.length;
  }

  function setPdfUrl(id: string, url: string | null) {
    setPdfUrls((map) => {
      if (map[id]) URL.revokeObjectURL(map[id]);
      const next = { ...map };
      if (url) next[id] = url;
      else delete next[id];
      return next;
    });
  }

  async function saveResume(draft: ResumeDraft, current: Resume | null) {
    const now = new Date().toISOString();
    const id = current?.id ?? crypto.randomUUID();
    const isPdf = draft.kind === 'pdf';
    const resume: Resume = {
      id,
      name: draft.name.trim(),
      kind: draft.kind,
      url: isPdf ? '' : safeUrl(draft.url),
      filePath: isPdf ? (draft.file ? `demo/${id}.pdf` : (current?.filePath ?? '')) : '',
      fileName: isPdf ? (draft.file?.name ?? current?.fileName ?? '') : '',
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    if (isPdf && draft.file) setPdfUrl(id, URL.createObjectURL(draft.file));
    if (!isPdf) setPdfUrl(id, null);
    setResumes((list) => (current ? list.map((r) => (r.id === id ? resume : r)) : [...list, resume]));
    if (current && current.name !== resume.name) setApps((list) => renameResumeInApps(list, resume));
    return true;
  }

  async function removeResume(resume: Resume) {
    setPdfUrl(resume.id, null);
    setResumes((list) => list.filter((r) => r.id !== resume.id));
    setApps((list) => detachResumeFromApps(list, resume.id));
    return true;
  }

  function reset() {
    setApps(demoApps());
    setResumes(demoResumes());
    for (const url of Object.values(pdfUrls)) URL.revokeObjectURL(url);
    setPdfUrls({});
    toast('已重設為範例資料');
  }

  const shell: Shell = {
    isDemo: true,
    basePath: '/demo',
    email: null,
    apps,
    shown: apps,
    samplesOn: false,
    loaded: true,
    offline: false,
    changeStaleDays,
    upsert,
    remove,
    importMany,
    resumes,
    resumesLoaded: true,
    resumeHref: (r) => (r.kind === 'url' ? r.url : (pdfUrls[r.id] ?? '')),
    saveResume,
    removeResume,
    signOut: () => router.push('/login'),
  };

  return (
    <ShellFrame shell={shell} banner={<DemoBanner onReset={reset} />}>
      {children}
    </ShellFrame>
  );
}

function DemoBanner({ onReset }: { onReset: () => void }) {
  return (
    <div role="note" className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-[10px] border border-primary/40 bg-primary/10 px-3.5 py-3">
      <p className="min-w-0 flex-[1_1_260px] text-sm">
        <strong className="font-medium">試用模式</strong>：可以自由新增、編輯和刪除，資料只存在這個分頁，重新整理就會重設。
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        <RotateCcw aria-hidden />
        重設範例
      </Button>
    </div>
  );
}
