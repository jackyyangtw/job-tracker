'use client';

import { useState } from 'react';
import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { shortDate } from '@/lib/dates';
import { flagsOf } from '@/lib/flags';
import { STATUS_STYLE } from '@/lib/statusStyle';
import { STATUS_LABEL, STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Common {
  staleDays: number;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}

function AppCard({ app, staleDays, onEdit, onStatus }: Common & { app: Application }) {
  const hasFlags = flagsOf(app, staleDays).length > 0;
  return (
    <Card className={cn('rounded-[9px] p-3', app.sample && 'border-dashed opacity-85')}>
      <div className="font-bold wrap-anywhere">
        {app.company} {app.sample && <SampleTag />}
      </div>
      {app.title && <div className="text-muted-foreground wrap-anywhere">{app.title}</div>}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {app.source && <Badge className="rounded-md">{app.source}</Badge>}
        {app.appliedAt && <span className="font-mono tabular-nums">投 {shortDate(app.appliedAt)}</span>}
        {app.followUpAt && <span className="font-mono tabular-nums">跟進 {shortDate(app.followUpAt)}</span>}
        {app.url && (
          <a className="text-primary underline-offset-2 hover:underline" href={app.url} target="_blank" rel="noopener noreferrer" aria-label="開啟職缺連結">
            連結
          </a>
        )}
      </div>
      {app.resume && <div className="text-xs text-muted-foreground">履歷：{app.resume}</div>}
      {hasFlags && (
        <div className="flex flex-wrap items-center gap-1">
          <FlagBadges app={app} staleDays={staleDays} />
        </div>
      )}
      {app.note && <div className="line-clamp-2 text-xs text-muted-foreground wrap-anywhere">{app.note}</div>}
      <div className="mt-0.5 flex items-center gap-1.5">
        <NativeSelect
          wrapperClassName="flex-1"
          className="min-h-10 text-[13px] md:min-h-8"
          value={app.status}
          disabled={app.sample}
          aria-label="變更狀態"
          onChange={(e) => onStatus(app.id, e.target.value as Status)}
        >
          {STATUS_LIST.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        {!app.sample && (
          <Button type="button" variant="outline" size="sm" className="max-md:h-10 max-md:px-4" aria-label={`編輯 ${app.company}`} onClick={() => onEdit(app.id)}>
            編輯
          </Button>
        )}
      </div>
    </Card>
  );
}

export function Board({ apps, ...common }: Common & { apps: Application[] }) {
  // Phones show one status at a time behind a tab bar; from md up every status is a column.
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

/** Small caption that only shows on phones, where the table collapses into stacked cards. */
function MobileLabel({ children }: { children: React.ReactNode }) {
  return <span className="mr-1.5 text-xs text-muted-foreground md:hidden">{children}</span>;
}

export function ListView({ apps, staleDays, onEdit }: Pick<Common, 'staleDays' | 'onEdit'> & { apps: Application[] }) {
  if (!apps.length) return <p className="text-muted-foreground">沒有符合的項目。</p>;
  const th = 'px-3 py-2 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground';
  // Phones: every row becomes a card (no horizontal scrolling). md and up: a regular table.
  const td = 'md:border-t md:px-3 md:py-2 md:align-top max-md:block max-md:py-0.5';
  const pill = 'max-md:inline-block max-md:mr-2';
  return (
    <div className="rounded-[10px] border bg-card md:overflow-x-auto">
      <table className="w-full border-collapse max-md:block md:min-w-[760px]">
        <thead className="max-md:sr-only">
          <tr>
            <th className={th}>公司／職位</th>
            <th className={th}>來源</th>
            <th className={th}>狀態</th>
            <th className={th}>投遞日</th>
            <th className={th}>履歷</th>
            <th className={th}>跟進</th>
            <th className={th}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="max-md:block">
          {apps.map((a) => (
            <tr key={a.id} className="max-md:block max-md:border-t max-md:p-3 max-md:first:border-t-0">
              <td className={td}>
                <div className="font-bold wrap-anywhere">
                  {a.company} {a.sample && <SampleTag />}
                </div>
                <div className="text-muted-foreground wrap-anywhere">
                  {a.title}
                  {a.url && (
                    <>
                      {a.title && ' · '}
                      <a className="text-primary underline-offset-2 hover:underline" href={a.url} target="_blank" rel="noopener noreferrer">
                        連結
                      </a>
                    </>
                  )}
                </div>
              </td>
              <td className={cn(td, pill, !a.source && 'max-md:hidden')}>{a.source}</td>
              <td className={cn(td, pill)}>
                <Badge className={STATUS_STYLE[a.status].pill}>
                  <span className={cn('size-[7px] rounded-full', STATUS_STYLE[a.status].dot)} />
                  {STATUS_LABEL[a.status]}
                </Badge>
              </td>
              <td className={cn(td, 'font-mono tabular-nums md:whitespace-nowrap', !a.appliedAt && 'max-md:hidden')}>
                <MobileLabel>投遞日</MobileLabel>
                {a.appliedAt}
              </td>
              <td className={cn(td, !a.resume && 'max-md:hidden')}>
                <MobileLabel>履歷</MobileLabel>
                {a.resume}
              </td>
              <td className={cn(td, 'font-mono tabular-nums md:whitespace-nowrap', !a.followUpAt && !flagsOf(a, staleDays).length && 'max-md:hidden')}>
                <MobileLabel>跟進</MobileLabel>
                {a.followUpAt} <FlagBadges app={a} staleDays={staleDays} />
              </td>
              <td className={cn(td, a.sample && 'max-md:hidden', 'max-md:pt-2')}>
                {!a.sample && (
                  <Button type="button" variant="outline" size="sm" className="max-md:h-10 max-md:px-4" aria-label={`編輯 ${a.company}`} onClick={() => onEdit(a.id)}>
                    編輯
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
