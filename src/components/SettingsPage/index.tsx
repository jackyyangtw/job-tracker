'use client';

import { useRef } from 'react';
import { Bell, Cloud, CloudOff, Download, Info, LogOut, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { todayStr } from '@/lib/dates';
import { downloadFile, toCsv, toJson } from '@/lib/data/exporters';
import { normalizeApp } from '@/lib/data/mapping';
import type { Application } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';
import AppearanceCard from './AppearanceCard';

const STALE_DAY_OPTIONS = [7, 10, 14, 21, 30];

/** 設定頁：帳號、提醒天數、資料備份與版本資訊。 */
export default function SettingsPage() {
  const { isDemo, email, apps, offline, changeStaleDays, importMany, signOut } = useShell();
  const staleDays = useTrackerStore((s) => s.staleDays);
  const store = useTrackerStore.getState;
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!isDemo) store().dismissSamples();
    toast(`已匯入 ${done} 筆`);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="sr-only">設定</h1>

      {isDemo ? (
        <Card className="gap-3 rounded-[10px]">
          <CardTitle>試用模式</CardTitle>
          <CardDescription>目前沒有登入，所有變更只存在這個分頁，重新整理就會回到範例資料。</CardDescription>
          <Button type="button" variant="outline" className="self-start" onClick={signOut}>
            <LogOut aria-hidden />
            離開試用
          </Button>
        </Card>
      ) : (
        <Card className="gap-3 rounded-[10px]">
          <CardTitle>帳號</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            {offline ? <CloudOff aria-hidden className="size-4 text-warn" /> : <Cloud aria-hidden className="size-4 text-primary" />}
            <span role="status" className="min-w-0 wrap-anywhere">
              {offline ? '離線中，顯示最近一次同步的資料' : '已同步'}
            </span>
          </div>
          <p className="text-sm wrap-anywhere text-muted-foreground">{email}</p>
          <Button type="button" variant="outline" className="self-start" onClick={signOut}>
            <LogOut aria-hidden />
            登出
          </Button>
        </Card>
      )}

      <AppearanceCard />

      <Card className="gap-3 rounded-[10px]">
        <CardTitle>提醒</CardTitle>
        <CardDescription>狀態為「已投遞」且超過這個天數沒有任何動靜，就會列入「該跟進了」。設定會同步到你所有的裝置。</CardDescription>
        <label className="inline-flex items-center gap-2 text-sm">
          <NativeSelect icon={<Bell />} aria-label="幾天沒消息就提醒" value={staleDays} onChange={(e) => changeStaleDays(Number(e.target.value))}>
            {STALE_DAY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} 天
              </option>
            ))}
          </NativeSelect>
          沒消息就提醒
        </label>
      </Card>

      <Card className="gap-3 rounded-[10px]">
        <CardTitle>資料備份</CardTitle>
        <CardDescription>匯出 JSON 可完整備份與還原；CSV 可以用試算表開啟。匯入時一次最多 300 筆。</CardDescription>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => exportAs('json')}>
            <Download aria-hidden />
            匯出 JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => exportAs('csv')}>
            <Download aria-hidden />
            匯出 CSV
          </Button>
          <Button type="button" variant="outline" onClick={pickImportFile}>
            <Upload aria-hidden />
            匯入 JSON
          </Button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
      </Card>

      <Card className="gap-2 rounded-[10px]">
        <CardTitle>關於</CardTitle>
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Info aria-hidden className="size-4" />
          版本 <span className="font-mono">{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </p>
      </Card>
    </main>
  );
}
