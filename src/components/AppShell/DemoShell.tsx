'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { mergeApplication } from '@/lib/applications/applicationList';
import { demoApps } from '@/lib/applications/demo';
import type { Application } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';
import type { Shell } from './ShellContext';
import ShellFrame from './ShellFrame';

/**
 * 試用模式（/demo）的外殼：不需要登入，資料只存在這個元件的 state 裡，
 * 所有新增、修改、刪除與匯入都不會碰到 Supabase。重新整理就回到初始範例。
 */
export default function DemoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [apps, setApps] = useState(demoApps);
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

  function reset() {
    setApps(demoApps());
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
