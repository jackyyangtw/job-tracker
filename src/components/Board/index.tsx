'use client';

import { useState } from 'react';
import { STATUS_STYLE } from '@/lib/statusStyle';
import { STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';
import AppCard from './AppCard';
import type { Common } from './types';

export { default as ListView } from './ListView';

export default function Board({ apps, ...common }: Common & { apps: Application[] }) {
  // 手機上以切換鈕一次顯示一個狀態；md 以上則每個狀態各一欄。
  const [active, setActive] = useState<Status>('applied');
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="切換狀態" className="grid grid-cols-3 gap-2 md:hidden">
        {STATUS_LIST.map((s) => {
          const count = apps.filter((a) => a.status === s.key).length;
          const on = s.key === active;
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(s.key)}
              className={cn(
                'flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on ? 'border-primary bg-card font-medium text-foreground' : 'bg-secondary text-muted-foreground',
              )}
            >
              <span aria-hidden className={cn('size-[9px] shrink-0 rounded-full', STATUS_STYLE[s.key].dot)} />
              {s.label}
              <span className="font-mono text-xs tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0 md:grid md:snap-x md:snap-proximity md:auto-cols-[minmax(188px,1fr)] md:grid-flow-col md:overflow-x-auto md:pb-2">
        {STATUS_LIST.map((s) => {
          const items = apps.filter((a) => a.status === s.key);
          return (
            <li
              key={s.key}
              className={cn(
                'flex min-w-0 snap-start flex-col content-start gap-2 rounded-xl bg-secondary p-2.5',
                s.key !== active && 'max-md:hidden',
              )}
            >
              <div className="flex items-center justify-between gap-2 px-1 py-0.5 max-md:hidden">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className={cn('size-[9px] rounded-full', STATUS_STYLE[s.key].dot)} />
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
