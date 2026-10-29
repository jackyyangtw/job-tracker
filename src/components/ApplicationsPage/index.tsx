'use client';

import { useState } from 'react';
import { ClipboardPaste, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AppForm from '@/components/AppForm';
import { useShell } from '@/components/AppShell';
import Board, { ListView } from '@/components/Board';
import { Reminders } from '@/components/Panels';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/useHydrated';
import { monthOf, monthsOf } from '@/lib/applications/applicationList';
import { addDays, todayStr } from '@/lib/dates';
import { copyText, followUpMessage } from '@/lib/data/exporters';
import { parseClipboardPrefill, type Prefill } from '@/lib/data/prefill';
import { STATUS_LABEL, type Application, type Status } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';
import Filters from './Filters';
import { usePrefillFromUrl } from './usePrefillFromUrl';
import { useUrlFilters } from './useUrlFilters';

/** 投遞頁：該跟進的清單、篩選、看板／列表，以及新增與編輯。 */
export default function ApplicationsPage() {
  const { isDemo, apps, shown, samplesOn, loaded, upsert, remove } = useShell();
  useUrlFilters();
  const view = useTrackerStore((s) => s.view);
  const staleDays = useTrackerStore((s) => s.staleDays);
  const source = useTrackerStore((s) => s.source);
  const query = useTrackerStore((s) => s.query);
  const month = useTrackerStore((s) => s.month);
  const store = useTrackerStore.getState;
  // 看板／列表取決於網址與 localStorage，伺服器端不知道；hydration 前先不畫，免得從看板跳成列表。
  const hydrated = useHydrated();

  const [form, setForm] = useState<{ open: boolean; id: string | null; prefill?: Prefill }>({ open: false, id: null });
  // 放在 useUrlFilters 之後：它同步網址時會保留不認得的參數，這裡再把預填參數拿掉。
  usePrefillFromUrl((prefill) => setForm({ open: true, id: null, prefill }));

  const q = query.trim().toLowerCase();
  const visible = shown.filter((a) => {
    if (source && a.source !== source) return false;
    if (month && monthOf(a) !== month) return false;
    if (!q) return true;
    return `${a.company} ${a.title} ${a.note} ${a.resume}`.toLowerCase().includes(q);
  });

  const resumeOptions = [...new Set(apps.map((a) => a.resume).filter(Boolean))];
  const editing = form.id ? apps.find((a) => a.id === form.id) ?? null : null;
  const openForm = (id: string | null) => setForm({ open: true, id });
  const closeForm = () => setForm({ open: false, id: null });
  const byId = (id: string) => apps.find((a) => a.id === id);

  async function saveApp(app: Application) {
    const ok = await upsert(app);
    if (ok) {
      if (!isDemo) store().dismissSamples();
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
  // iOS 捷徑打不開主畫面 App，改由捷徑拷貝預填網址、這裡讀剪貼簿；iOS 會先跳出「貼上」確認。
  async function addFromClipboard() {
    let clip: string;
    try {
      clip = await navigator.clipboard.readText();
    } catch {
      toast('無法讀取剪貼簿，請改用「新增投遞」並在職缺連結欄貼上');
      return;
    }
    const prefill = parseClipboardPrefill(clip);
    if (prefill) setForm({ open: true, id: null, prefill });
    else toast('剪貼簿裡沒有職缺連結');
  }
  async function copyMessage(id: string) {
    const a = byId(id);
    if (!a) return;
    const ok = await copyText(followUpMessage(a));
    toast(ok ? '已複製跟進訊息' : '無法自動複製，請改用「編輯」查看資料後手動撰寫');
  }

  return (
    <main id="main" className="flex flex-col gap-[18px]">
      {/* 導覽列已標示目前頁面，標題只留給螢幕閱讀器 */}
      <h1 className="sr-only">投遞</h1>

      {samplesOn ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-[10px] bg-secondary px-3.5 py-3">
          <p className="min-w-0 flex-[1_1_260px]">目前顯示的是範例資料，用來預覽版面和提醒功能。新增第一筆投遞後，範例會自動消失。</p>
          <Button type="button" variant="outline" size="sm" onClick={() => store().dismissSamples()}>
            清除範例
          </Button>
        </div>
      ) : null}

      <Reminders apps={shown} staleDays={staleDays} onFollowed={followed} onCopy={(id) => void copyMessage(id)} onEdit={openForm} />

      <Filters
        months={monthsOf(shown)}
        action={
          // 桌機版的新增按鈕放在篩選列尾端；手機版改用右下角的浮動按鈕。
          // 「從剪貼簿新增」是給 iOS 捷徑用的，試用的訪客用不到，試用模式不顯示。
          <>
            {isDemo ? null : (
              <Button type="button" variant="outline" className="max-md:hidden" onClick={() => void addFromClipboard()}>
                <ClipboardPaste aria-hidden />
                從剪貼簿新增
              </Button>
            )}
            <Button type="button" className="max-md:hidden" onClick={() => openForm(null)}>
              <Plus aria-hidden />
              新增投遞
            </Button>
          </>
        }
      />

      {!loaded || !hydrated ? (
        <p role="status" className="py-7 text-center text-muted-foreground">
          載入中…
        </p>
      ) : view === 'board' ? (
        <Board apps={visible} staleDays={staleDays} onEdit={openForm} onStatus={changeStatus} />
      ) : (
        // 手機版沒有看板／列表切換，一律用看板（狀態切換＋卡片）；列表只在桌機版顯示。
        <>
          <div className="md:hidden">
            <Board apps={visible} staleDays={staleDays} onEdit={openForm} onStatus={changeStatus} />
          </div>
          <div className="max-md:hidden">
            <ListView apps={visible} staleDays={staleDays} onEdit={openForm} />
          </div>
        </>
      )}

      <div className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 md:hidden">
        {isDemo ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12 rounded-full bg-background shadow-lg pointer-coarse:size-12"
            aria-label="從剪貼簿新增"
            title="從剪貼簿新增"
            onClick={() => void addFromClipboard()}
          >
            <ClipboardPaste aria-hidden />
          </Button>
        )}
        <Button type="button" className="h-12 rounded-full px-5 shadow-lg pointer-coarse:h-12" onClick={() => openForm(null)}>
          <Plus aria-hidden />
          新增投遞
        </Button>
      </div>

      {form.open ? (
        <AppForm key={form.id ?? 'new'} initial={editing} prefill={form.prefill} isDemo={isDemo} resumeOptions={resumeOptions} onSave={saveApp} onDelete={deleteApp} onClose={closeForm} />
      ) : null}
    </main>
  );
}
