'use client';

import { useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AppForm from '@/components/AppForm';
import { Board, ListView } from '@/components/Board';
import { Reminders, StatsPanels, Tiles } from '@/components/Panels';
import { Button } from '@/components/ui/button';
import { useApplications } from '@/hooks/useApplications';
import { useApplicationsRealtime } from '@/hooks/useApplicationsRealtime';
import { useImportApplications } from '@/hooks/useImportApplications';
import { useRemoveApplication } from '@/hooks/useRemoveApplication';
import { useStaleDaysSync } from '@/hooks/useStaleDaysSync';
import { useUpsertApplication } from '@/hooks/useUpsertApplication';
import { addDays, todayStr } from '@/lib/dates';
import { copyText, downloadFile, followUpMessage, toCsv, toJson } from '@/lib/exporters';
import { flagsOf } from '@/lib/flags';
import { normalizeApp } from '@/lib/mapping';
import { sampleApps } from '@/lib/sample';
import { signOutAndClear } from '@/lib/signOut';
import { STATUS_LABEL, type Application, type Status } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';
import Filters from './Filters';
import Header from './Header';
import { useAppBadge } from './useAppBadge';
import { useUrlFilters } from './useUrlFilters';

export default function Dashboard({ session }: { session: Session }) {
  const userId = session.user.id;
  const qc = useQueryClient();
  const { apps, loaded, offline } = useApplications(userId);
  useApplicationsRealtime(userId);
  useUrlFilters();
  const changeStaleDays = useStaleDaysSync(userId);
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

  const samplesOn = loaded && apps.length === 0 && !samplesDismissed;
  const shown = samplesOn ? sampleApps() : apps;

  const q = query.trim().toLowerCase();
  const visible = shown.filter((a) => {
    if (source && a.source !== source) return false;
    if (!q) return true;
    return `${a.company} ${a.title} ${a.note} ${a.resume}`.toLowerCase().includes(q);
  });

  const pending = shown.filter((a) => flagsOf(a, staleDays).length > 0).length;
  useAppBadge(pending, loaded);

  const resumeOptions = [...new Set(apps.map((a) => a.resume).filter(Boolean))];
  const editing = form.id ? apps.find((a) => a.id === form.id) ?? null : null;
  const openForm = (id: string | null) => setForm({ open: true, id });
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
    void upsert(next).then((ok) => ok && toast(`狀態已改為「${STATUS_LABEL[status]}」`));
  }
  function followed(id: string) {
    const a = byId(id);
    if (!a) return;
    void upsert({ ...a, lastContact: todayStr(), followUpAt: addDays(7) }).then((ok) => ok && toast('已記錄，7 天後會再提醒你'));
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

  function pickImportFile() {
    if (!fileRef.current) return;
    fileRef.current.value = '';
    fileRef.current.click();
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

  function signOut() {
    store().resetFilters();
    void signOutAndClear(qc);
  }

  const chip = offline ? '離線中，顯示最近一次同步的資料' : `已同步 · ${session.user.email ?? ''}`;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-[18px]">
      <Header offline={offline} chip={chip} onExport={exportAs} onImport={pickImportFile} onSignOut={signOut} onAdd={() => openForm(null)} />

      {samplesOn && (
        <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-[10px] bg-secondary px-3.5 py-3">
          <p className="min-w-0 flex-[1_1_260px]">目前顯示的是範例資料，用來預覽版面和提醒功能。新增第一筆投遞後，範例會自動消失。</p>
          <Button type="button" variant="outline" size="sm" onClick={() => store().dismissSamples()}>
            清除範例
          </Button>
        </div>
      )}

      <Tiles apps={shown} staleDays={staleDays} />
      <Reminders apps={shown} staleDays={staleDays} onFollowed={followed} onCopy={(id) => void copyMessage(id)} onEdit={openForm} />

      <Filters onStaleDaysChange={changeStaleDays} />

      <main>
        {!loaded ? (
          <p role="status" className="py-7 text-center text-muted-foreground">
            載入中…
          </p>
        ) : view === 'board' ? (
          <Board apps={visible} staleDays={staleDays} onEdit={openForm} onStatus={changeStatus} />
        ) : (
          <ListView apps={visible} staleDays={staleDays} onEdit={openForm} />
        )}
      </main>

      <StatsPanels apps={shown} />

      {form.open && (
        <AppForm key={form.id ?? 'new'} initial={editing} resumeOptions={resumeOptions} onSave={saveApp} onDelete={deleteApp} onClose={closeForm} />
      )}
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
    </div>
  );
}
