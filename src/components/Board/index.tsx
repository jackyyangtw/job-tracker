'use client';

import { useState } from 'react';
import { STATUS_STYLE } from '@/lib/statusStyle';
import { STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';
import AppCard from './AppCard';
import type { Common } from './types';

export { default as ListView } from './ListView';

type Filter = Status | 'all';

/**
 * 看板。桌機版每個狀態一欄；手機版上方是可橫向捲動的狀態切換（含「全部」），
 * 「全部」時依狀態分段列出，選了某個狀態就只列那個狀態。
 */
export default function Board({ apps, ...common }: Common & { apps: Application[] }) {
  const [active, setActive] = useState<Filter>('all');
  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: apps.length },
    ...STATUS_LIST.map((s) => ({ key: s.key, label: s.label, count: apps.filter((a) => a.status === s.key).length })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="依狀態顯示" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {chips.map((c) => {
          const on = c.key === active;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(c.key)}
              className={cn(
                'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on ? 'border-primary bg-primary/15 font-medium text-foreground' : 'bg-card text-muted-foreground',
              )}
            >
              {c.key === 'all' ? null : <span aria-hidden className={cn('size-2 shrink-0 rounded-full', STATUS_STYLE[c.key].dot)} />}
              {c.label}
              <span className="font-mono text-xs tabular-nums">{c.count}</span>
            </button>
          );
        })}
      </div>

      {active === 'all' && !apps.length ? <p className="py-6 text-center text-sm text-muted-foreground md:hidden">沒有符合的項目。</p> : null}

      <ul className="m-0 flex list-none flex-col gap-4 p-0 md:grid md:snap-x md:snap-proximity md:auto-cols-[minmax(188px,1fr)] md:grid-flow-col md:gap-3 md:overflow-x-auto md:pb-2">
        {STATUS_LIST.map((s) => {
          const items = apps.filter((a) => a.status === s.key);
          // 手機版：選了別的狀態，或「全部」時這個狀態沒有項目，就不顯示這一段。
          const hiddenOnMobile = active === 'all' ? items.length === 0 : s.key !== active;
          return (
            <li
              key={s.key}
              className={cn(
                'flex min-w-0 snap-start flex-col content-start gap-2 md:rounded-xl md:bg-secondary md:p-2.5',
                hiddenOnMobile && 'max-md:hidden',
              )}
            >
              {/* 欄位標題：桌機版一律顯示；手機版只在「全部」時當作分段標題 */}
              <div className={cn('flex items-center justify-between gap-2 px-1 py-0.5', active !== 'all' && 'max-md:hidden')}>
                <span className="inline-flex items-center gap-1.5 font-medium max-md:text-[13px] max-md:text-muted-foreground">
                  <span aria-hidden className={cn('size-[9px] rounded-full', STATUS_STYLE[s.key].dot)} />
                  {s.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
              </div>
              {items.length ? (
                items.map((a) => <AppCard key={a.id} app={a} {...common} />)
              ) : (
                <div className="px-1.5 py-3.5 text-center text-xs text-muted-foreground">沒有項目</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
