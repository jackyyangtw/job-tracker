'use client';

import { useShell } from '@/components/AppShell';
import { SourceTallyPanel, Tiles } from '@/components/Panels';
import { useTrackerStore } from '@/store/useTrackerStore';
import FunnelPanel from './FunnelPanel';
import ResumePerformancePanel from './ResumePerformancePanel';
import TrendPanel from './TrendPanel';

/** 統計頁：摘要卡片、投遞趨勢、轉換漏斗、各來源回應率與履歷版本成效。 */
export default function StatisticsPage() {
  const { shown, samplesOn, loaded } = useShell();
  const staleDays = useTrackerStore((s) => s.staleDays);

  return (
    <main id="main" className="flex flex-col gap-[18px]">
      <h1 className="sr-only">統計</h1>
      {samplesOn ? <p className="rounded-[10px] bg-secondary px-3.5 py-3">目前顯示的是範例資料的統計，新增第一筆投遞後就會改用你的資料。</p> : null}
      {!loaded ? (
        <p role="status" className="py-7 text-center text-muted-foreground">
          載入中…
        </p>
      ) : (
        <>
          <Tiles apps={shown} staleDays={staleDays} />
          <TrendPanel apps={shown} />
          <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3" aria-label="轉換與回應率">
            <FunnelPanel apps={shown} />
            <SourceTallyPanel apps={shown} />
          </section>
          <ResumePerformancePanel apps={shown} />
        </>
      )}
    </main>
  );
}
