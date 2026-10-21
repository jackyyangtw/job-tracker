'use client';

import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplications } from '@/hooks/useApplications';
import { useApplicationsRealtime } from '@/hooks/useApplicationsRealtime';
import { useImportApplications } from '@/hooks/useImportApplications';
import { useRemoveApplication } from '@/hooks/useRemoveApplication';
import { useUpsertApplication } from '@/hooks/useUpsertApplication';
import { signOutAndClear } from '@/lib/signOut';
import { addDays, todayStr } from '@/lib/dates';
import { copyText, downloadFile, followUpMessage, toCsv, toJson } from '@/lib/exporters';
import { flagsOf } from '@/lib/flags';
import { normalizeApp } from '@/lib/mapping';
import { sampleApps } from '@/lib/sample';
import { SOURCES, STATUS_LABEL, type Application, type Status } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';
import AppForm from './AppForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Board, ListView } from './Board';
import { Reminders, StatsPanels, Tiles } from './Panels';

type BadgeNav = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

export default function Dashboard({ session }: { session: Session }) {
  const userId = session.user.id;
  const qc = useQueryClient();
  const { apps, loaded, offline } = useApplications(userId);
  useApplicationsRealtime(userId);
  const upsert = useUpsertApplication(userId);
  const remove = useRemoveApplication(userId);
  const importMany = useImportApplications(userId);
  const view = useTrackerStore((s) => s.view);
  const staleDays = useTrackerStore((s) => s.staleDays);
  const samplesDismissed = useTrackerStore((s) => s.samplesDismissed);
  const source = useTrackerStore((s) => s.source);
  const query = useTrackerStore((s) => s.query);
  const store = useTrackerStore.getState;

  const [form, setForm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const fileRef = useRef<HTMLInputElement>(null);

  // Mirror view / search / source into the URL so a reload or a shared link keeps them.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get('view');
    if (v === 'board' || v === 'list') store().setView(v);
    store().setQuery(p.get('q') ?? '');
    store().setSource(p.get('source') ?? '');
  }, [store]);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sync = (key: string, value: string) => (value ? p.set(key, value) : p.delete(key));
    sync('view', view);
    sync('q', query);
    sync('source', source);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [view, query, source]);

  const samplesOn = loaded && apps.length === 0 && !samplesDismissed;
  const examples = samplesOn ? sampleApps() : [];
  const shown = samplesOn ? examples : apps;

  const q = query.trim().toLowerCase();
  const visible = shown.filter((a) => {
    if (source && a.source !== source) return false;
    if (!q) return true;
    return `${a.company} ${a.title} ${a.note} ${a.resume}`.toLowerCase().includes(q);
  });

  // PWA app-icon badge = number of applications that need attention. Unsupported browsers ignore it.
  const pending = shown.filter((a) => flagsOf(a, staleDays).length > 0).length;
  useEffect(() => {
    const nav = navigator as BadgeNav;
    if (!loaded) return;
    if (pending > 0) void nav.setAppBadge?.(pending).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  }, [pending, loaded]);

  const resumeOptions = [...new Set(apps.map((a) => a.resume).filter(Boolean))];
  const editing = form.id ? apps.find((a) => a.id === form.id) ?? null : null;
  const closeForm = () => setForm({ open: false, id: null });
  const byId = (id: string) => apps.find((a) => a.id === id);

  async function saveApp(app: Application) {
    const ok = await upsert(app);
    if (ok) {
      store().dismissSamples();
      toast(editing ? '已更新' : '已新增');
    }
    return ok;
  }
  async function deleteApp(id: string) {
    const ok = await remove(id);
    if (ok) toast('已刪除');
    return ok;
  }
  function changeStatus(id: string, status: Status) {
    const a = byId(id);
    if (!a || a.status === status) return;
    const next = { ...a, status, appliedAt: status === 'applied' && !a.appliedAt ? todayStr() : a.appliedAt };
    void upsert(next)
      .then((ok) => ok && toast(`狀態已改為「${STATUS_LABEL[status]}」`));
  }
  function followed(id: string) {
    const a = byId(id);
    if (!a) return;
    void upsert({ ...a, lastContact: todayStr(), followUpAt: addDays(7) })
      .then((ok) => ok && toast('已記錄，7 天後會再提醒你'));
  }
  async function copyMessage(id: string) {
    const a = byId(id);
    if (!a) return;
    const ok = await copyText(followUpMessage(a));
    toast(ok ? '已複製跟進訊息' : '無法自動複製，請改用「編輯」查看資料後手動撰寫');
  }

  function exportAs(kind: 'json' | 'csv') {
    if (!apps.length) return toast('目前沒有資料可以匯出');
    const day = todayStr();
    if (kind === 'json') downloadFile(`job-tracker-${day}.json`, toJson(apps), 'application/json');
    else downloadFile(`job-tracker-${day}.csv`, toCsv(apps), 'text/csv');
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      return toast('這不是有效的 JSON 檔');
    }
    const arr = Array.isArray(data) ? data : (data as { apps?: unknown })?.apps;
    if (!Array.isArray(arr)) return toast('檔案裡找不到投遞資料');
    const items = arr.slice(0, 300).map(normalizeApp).filter((a): a is Application => a !== null);
    if (!items.length) return toast('檔案裡沒有可匯入的項目');
    const done = await importMany(items);
    store().dismissSamples();
    toast(`已匯入 ${done} 筆`);
  }

  const chip = offline ? '離線中，顯示最近一次同步的資料' : `已同步 · ${session.user.email ?? ''}`;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-[18px]">
      <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div>
          <h1 className="text-[21px] leading-tight tracking-[0.01em] text-balance sm:text-2xl">投遞追蹤看板</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            <span className="font-mono tabular-nums">{todayStr()}</span> · 記錄每一次投遞，看出哪個管道和哪份履歷有回應
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge role="status" className={cn('max-w-full wrap-anywhere', offline && 'bg-warn/15 text-warn')}>{chip}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" aria-label="資料備份選單">
                資料備份
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => exportAs('json')}>匯出 JSON（完整備份）</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportAs('csv')}>匯出 CSV（可用試算表開啟）</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (fileRef.current) {
                    fileRef.current.value = '';
                    fileRef.current.click();
                  }
                }}
              >
                匯入 JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="outline" onClick={() => {
              store().resetFilters();
              void signOutAndClear(qc);
            }}>
            登出
          </Button>
          <Button type="button" onClick={() => setForm({ open: true, id: null })}>
            ＋ 新增投遞
          </Button>
        </div>
      </header>

      {samplesOn && (
        <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-[10px] bg-secondary px-3.5 py-3">
          <p className="min-w-0 flex-[1_1_260px]">目前顯示的是範例資料，用來預覽版面和提醒功能。新增第一筆投遞後，範例會自動消失。</p>
          <Button type="button" variant="outline" size="sm" onClick={() => store().dismissSamples()}>
            清除範例
          </Button>
        </div>
      )}

      <Tiles apps={shown} staleDays={staleDays} />
      <Reminders apps={shown} staleDays={staleDays} onFollowed={followed} onCopy={(id) => void copyMessage(id)} onEdit={(id) => setForm({ open: true, id })} />

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          aria-label="檢視方式"
          value={view}
          // Radix reports an empty string when the active item is clicked again; keep the current view in that case.
          onValueChange={(v) => v && store().setView(v as 'board' | 'list')}
        >
          <ToggleGroupItem value="board">看板</ToggleGroupItem>
          <ToggleGroupItem value="list">列表</ToggleGroupItem>
        </ToggleGroup>
        <Input
          type="search"
          className="flex-[1_1_200px]"
          placeholder="搜尋公司、職位、備註"
          aria-label="搜尋"
          value={query}
          onChange={(e) => store().setQuery(e.target.value)}
        />
        <NativeSelect aria-label="依來源篩選" value={source} onChange={(e) => store().setSource(e.target.value)}>
          <option value="">所有來源</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
        <label className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          超過
          <NativeSelect aria-label="幾天沒消息就提醒" value={staleDays} onChange={(e) => store().setStaleDays(Number(e.target.value))}>
            {[7, 10, 14, 21, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
          天沒消息就提醒
        </label>
      </div>

      <main>
        {!loaded ? (
          <p role="status" className="py-7 text-center text-muted-foreground">載入中…</p>
        ) : view === 'board' ? (
          <Board apps={visible} staleDays={staleDays} onEdit={(id) => setForm({ open: true, id })} onStatus={changeStatus} />
        ) : (
          <ListView apps={visible} staleDays={staleDays} onEdit={(id) => setForm({ open: true, id })} />
        )}
      </main>

      <StatsPanels apps={shown} />

      {form.open && (
        <AppForm
          key={form.id ?? 'new'}
          initial={editing}
          resumeOptions={resumeOptions}
          onSave={saveApp}
          onDelete={deleteApp}
          onClose={closeForm}
        />
      )}
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
    </div>
  );
}
