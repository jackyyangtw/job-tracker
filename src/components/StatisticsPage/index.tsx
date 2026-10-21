'use client';

import { useShell } from '@/components/AppShell';
import { StatsPanels, Tiles } from '@/components/Panels';
import { useTrackerStore } from '@/store/useTrackerStore';

/** 統計頁：摘要卡片與各來源、各履歷版本的回應率。 */
export default function StatisticsPage() {
  const { shown, samplesOn, loaded } = useShell();
  const staleDays = useTrackerStore((s) => s.staleDays);

  return (
    <main className="flex flex-col gap-[18px]">
      <h1 className="text-xl leading-tight font-medium">統計</h1>
      {samplesOn ? <p className="rounded-[10px] bg-secondary px-3.5 py-3">目前顯示的是範例資料的統計，新增第一筆投遞後就會改用你的資料。</p> : null}
      {!loaded ? (
        <p role="status" className="py-7 text-center text-muted-foreground">
          載入中…
        </p>
      ) : (
        <>
          <Tiles apps={shown} staleDays={staleDays} />
          <StatsPanels apps={shown} />
        </>
      )}
    </main>
  );
}
