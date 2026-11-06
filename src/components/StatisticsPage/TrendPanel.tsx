'use client';

import { useState } from 'react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { monthLabel, todayStr } from '@/lib/dates';
import { trend, type TrendBucket, type TrendUnit } from '@/lib/stats/trend';
import type { Application } from '@/lib/types';

/** 兩種區間都顯示最近 12 段。 */
const COUNT = 12;
const UNIT_TEXT: Record<TrendUnit, { toggle: string; span: string; of: (b: TrendBucket) => string }> = {
  week: { toggle: '每週', span: `最近 ${COUNT} 週`, of: (b) => `${b.label} 那週` },
  month: { toggle: '每月', span: `最近 ${COUNT} 個月`, of: (b) => monthLabel(b.key) },
};

/** 投遞趨勢：依投遞日統計每週／每月的投遞數。 */
export default function TrendPanel({ apps }: { apps: Application[] }) {
  const [unit, setUnit] = useState<TrendUnit>('week');
  const { buckets, undated } = trend(apps, unit, todayStr(), COUNT);
  const total = buckets.reduce((sum, b) => sum + b.n, 0);
  const max = Math.max(1, ...buckets.map((b) => b.n));
  const text = UNIT_TEXT[unit];

  return (
    <Card className="gap-3 rounded-[10px]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle>投遞趨勢</CardTitle>
          <CardDescription>
            {text.span}共投遞 {total} 筆（依投遞日）
            {undated ? `；另有 ${undated} 筆沒填投遞日，未列入` : ''}
          </CardDescription>
        </div>
        <ToggleGroup type="single" aria-label="統計區間" value={unit} onValueChange={(v) => v && setUnit(v as TrendUnit)}>
          {(Object.keys(UNIT_TEXT) as TrendUnit[]).map((u) => (
            <ToggleGroupItem key={u} value={u} className="min-h-8 px-3 text-xs">
              {UNIT_TEXT[u].toggle}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ol className="m-0 grid h-36 list-none grid-cols-12 items-end gap-1 pl-0 sm:gap-2">
        {buckets.map((b, i) => (
          <li key={b.key} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
            <span className="sr-only">
              {text.of(b)}：{b.n} 筆
            </span>
            <span aria-hidden className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {b.n || ''}
            </span>
            <div
              aria-hidden
              className={i === buckets.length - 1 ? 'w-full rounded-t-sm bg-primary' : 'w-full rounded-t-sm bg-primary/55'}
              // 0 筆時留一條細線，看得出那段有算到
              style={{ height: b.n ? `${(b.n / max) * 100}%` : '2px' }}
            />
            {/* 手機上 12 個標籤太擠，只顯示隔一個的 */}
            <span aria-hidden className={`font-mono text-[10px] whitespace-nowrap text-muted-foreground tabular-nums ${(buckets.length - 1 - i) % 2 ? 'max-sm:invisible' : ''}`}>
              {b.label}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
